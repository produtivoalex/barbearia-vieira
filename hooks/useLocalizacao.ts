import { useCallback, useEffect, useState } from 'react';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY_LOCATION = '@barbearia/localizacao-usuario';

export interface Coordenadas {
  latitude: number;
  longitude: number;
}

export function useLocalizacao(autoSolicitar = true) {
  const [coordenadas, setCoordenadas] = useState<Coordenadas | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [permissaoConcedida, setPermissaoConcedida] = useState<boolean | null>(null);

  const obterLocalizacao = useCallback(async () => {
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

      // 3. Tenta obter a última localização conhecida (mais rápido)
      let location = await Location.getLastKnownPositionAsync();
      if (!location) {
        // Se não houver em cache do SO, busca com precisão balanceada
        location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
      }

      if (location?.coords) {
        const coords: Coordenadas = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };
        setCoordenadas(coords);
        await AsyncStorage.setItem(STORAGE_KEY_LOCATION, JSON.stringify(coords));
        return coords;
      }
    } catch (err) {
      console.warn('[useLocalizacao] Erro ao obter localização:', err);
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
