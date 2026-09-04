import { useCallback, useEffect, useState } from 'react';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY_LOCATION = '@barbearia/localizacao-usuario';

export interface Coordenadas {
  latitude: number;
  longitude: number;
  precisao?: number | null;
  atualizadoEm?: number;
}

export function useLocalizacao(autoSolicitar = true) {
  const [coordenadas, setCoordenadas] = useState<Coordenadas | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [permissaoConcedida, setPermissaoConcedida] = useState<boolean | null>(null);

  const obterLocalizacao = useCallback(async (forcarAltaPrecisao = true) => {
    setCarregando(true);
    try {
      // 1. Tenta recuperar do cache local primeiro para resposta imediata
      const cached = await AsyncStorage.getItem(STORAGE_KEY_LOCATION);
      if (cached) {
        try {
          const parsed = JSON.parse(cached) as Coordenadas;
          if (parsed.latitude && parsed.longitude) {
            setCoordenadas(parsed);
          }
        } catch {}
      }

      // 2. Verifica / solicita permissão de localização em primeiro plano
      let { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        const resposta = await Location.requestForegroundPermissionsAsync();
        status = resposta.status;
      }

      if (status !== 'granted') {
        setPermissaoConcedida(false);
        setCarregando(false);
        return null;
      }

      setPermissaoConcedida(true);

      // 3. Tenta obter a última localização conhecida do SO para resposta rápida instantânea
      try {
        const lastKnown = await Location.getLastKnownPositionAsync();
        if (lastKnown?.coords) {
          setCoordenadas((prev) => prev ?? {
            latitude: lastKnown.coords.latitude,
            longitude: lastKnown.coords.longitude,
            precisao: lastKnown.coords.accuracy,
            atualizadoEm: lastKnown.timestamp,
          });
        }
      } catch {}

      // 4. SEMPRE busca a posição ATUAL em tempo real com ALTA PRECISÃO (GPS via satélite)
      // Usamos race com timeout de 8s para evitar travamento em locais fechados sem sinal de satélite
      const promiseGps = Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const promiseTimeout = new Promise<null>((resolve) =>
        setTimeout(() => resolve(null), 8000)
      );

      let location = await Promise.race([promiseGps, promiseTimeout]);

      // Se alta precisão demorou ou não respondeu, tenta precisão balanceada como fallback
      if (!location) {
        location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
      }

      if (location?.coords) {
        const coords: Coordenadas = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          precisao: location.coords.accuracy,
          atualizadoEm: location.timestamp,
        };
        setCoordenadas(coords);
        await AsyncStorage.setItem(STORAGE_KEY_LOCATION, JSON.stringify(coords));
        return coords;
      }
    } catch (err) {
      console.warn('[useLocalizacao] Erro ao obter localização com alta precisão:', err);
    } finally {
      setCarregando(false);
    }
    return null;
  }, []);

  useEffect(() => {
    if (autoSolicitar) {
      obterLocalizacao().catch(() => {});
    }
  }, [autoSolicitar, obterLocalizacao]);

  return {
    coordenadas,
    carregando,
    permissaoConcedida,
    obterLocalizacao,
  };
}

