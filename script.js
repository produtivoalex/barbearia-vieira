// ==========================================================================
// NA RÉGUA — INTERACTIVE SCRIPT & UX
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
  // 1. Sticky Navbar on Scroll
  const navbar = document.querySelector('.navbar');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });

  // 2. Interactive Phone Mockup Tab Switcher
  const tabBtns = document.querySelectorAll('.phone-tab-btn');
  const screenContent = document.getElementById('phone-screen-body');

  const screens = {
    inicio: `
      <div class="phone-card-content">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <span style="font-size:0.75rem; color:#CBA14A; font-weight:700;">Próxima Agenda</span>
          <span style="font-size:0.68rem; background:rgba(203,161,74,0.15); color:#E5C378; padding:2px 6px; border-radius:4px;">Seg • 19:30</span>
        </div>
        <p style="font-size:0.8rem; font-weight:800; color:#FFF; margin-bottom:4px;">Abertura Semanal Automatizada</p>
        <p style="font-size:0.7rem; color:#A1A1AA; line-height:1.3;">Receba notificação push no instante em que a agenda abrir.</p>
      </div>

      <div class="phone-card-content" style="border-color:rgba(16,185,129,0.3); background:rgba(16,185,129,0.06);">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div>
            <span style="font-size:0.7rem; color:#10B981; font-weight:800;">SEU DE SEMPRE ✂️</span>
            <p style="font-size:0.82rem; font-weight:800; color:#FFF; margin-top:2px;">Corte + Barba Terapia</p>
          </div>
          <button style="background:#10B981; border:none; color:#000; font-size:0.7rem; font-weight:800; padding:6px 10px; border-radius:6px; cursor:pointer;">Agendar</button>
        </div>
      </div>

      <div class="phone-card-content">
        <p style="font-size:0.75rem; font-weight:800; color:#FFF; margin-bottom:6px;">Vagas desta Semana</p>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px;">
          <div style="background:#1C1C24; padding:8px; border-radius:6px; text-align:center;">
            <p style="font-size:0.7rem; color:#A1A1AA;">Terça</p>
            <p style="font-size:0.75rem; font-weight:800; color:#10B981;">2 livres</p>
          </div>
          <div style="background:#1C1C24; padding:8px; border-radius:6px; text-align:center;">
            <p style="font-size:0.7rem; color:#A1A1AA;">Sábado</p>
            <p style="font-size:0.75rem; font-weight:800; color:#EF4444;">Lotado</p>
          </div>
        </div>
      </div>
    `,
    vitrine: `
      <div class="phone-card-content" style="padding:0; overflow:hidden;">
        <div style="position:relative; height:130px; background:#1C1C24; display:flex; align-items:center; justify-content:center;">
          <img src="assets/barbearia-vieira-banner.png" style="width:100%; height:100%; object-fit:cover;" onerror="this.style.display='none'" />
          <div style="position:absolute; inset:0; background:linear-gradient(to top, #0A0A0C, transparent 60%);"></div>
          <span style="position:absolute; bottom:8px; left:10px; font-size:0.78rem; font-weight:800; color:#FFF;">Degradê Navalhado</span>
          <span style="position:absolute; top:8px; right:8px; background:rgba(0,0,0,0.7); font-size:0.65rem; color:#FFF; padding:2px 6px; border-radius:4px;">#1 Destaque</span>
        </div>
      </div>

      <div class="phone-card-content">
        <p style="font-size:0.75rem; font-weight:800; color:#CBA14A; margin-bottom:4px;">Vitrine com até 30 Mídias</p>
        <p style="font-size:0.7rem; color:#A1A1AA;">Reorganização dinâmica por drag & drop, suporte a fotos, vídeos em loop e destaques.</p>
      </div>

      <div style="background:#14141A; border:1px dashed var(--ouro-border); border-radius:8px; padding:10px; text-align:center;">
        <p style="font-size:0.72rem; color:#E5C378; font-weight:700;">+ Adicionar Nova Foto/Vídeo</p>
      </div>
    `,
    fila: `
      <div class="phone-card-content" style="border-color:rgba(203,161,74,0.4); background:rgba(203,161,74,0.05);">
        <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
          <span style="font-size:0.9rem;">⚡</span>
          <span style="font-size:0.75rem; font-weight:800; color:#E5C378;">Fila de Espera Inteligente</span>
        </div>
        <p style="font-size:0.7rem; color:#A1A1AA; line-height:1.3;">Sua agenda lotou? O cliente entra na fila com preferências de dia e horário.</p>
      </div>

      <div class="phone-card-content">
        <p style="font-size:0.72rem; color:#A1A1AA; margin-bottom:6px;">Notificação Automática ao Liberar Vaga:</p>
        <div style="background:#1A1A22; border-left:3px solid #10B981; padding:8px 10px; border-radius:4px;">
          <p style="font-size:0.7rem; font-weight:800; color:#FFF;">"Surgiu uma vaga: Sexta às 09:00!"</p>
          <p style="font-size:0.65rem; color:#10B981; margin-top:2px;">Tempo para aceitar: 04:32</p>
        </div>
      </div>
    `,
    gestao: `
      <div class="phone-card-content">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <span style="font-size:0.75rem; font-weight:800; color:#FFF;">Painel do Barbeiro</span>
          <span style="font-size:0.68rem; color:#10B981; font-weight:700;">● Online</span>
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px;">
          <div style="background:#181820; padding:8px; border-radius:6px;">
            <p style="font-size:0.65rem; color:#A1A1AA;">Hoje (Manhã)</p>
            <p style="font-size:0.9rem; font-weight:900; color:#CBA14A;">4 / 4 vagas</p>
          </div>
          <div style="background:#181820; padding:8px; border-radius:6px;">
            <p style="font-size:0.65rem; color:#A1A1AA;">Faturamento</p>
            <p style="font-size:0.9rem; font-weight:900; color:#10B981;">R$ 220,00</p>
          </div>
        </div>
      </div>

      <div class="phone-card-content">
        <p style="font-size:0.72rem; font-weight:800; color:#FFF; margin-bottom:6px;">Próximo Cliente:</p>
        <p style="font-size:0.78rem; font-weight:800; color:#E5C378;">08:00 • Marcos Silva</p>
        <p style="font-size:0.68rem; color:#A1A1AA;">Corte + Barboterapia • Confirmado</p>
      </div>
    `
  };

  if (screenContent) {
    screenContent.innerHTML = screens.inicio;

    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const target = btn.getAttribute('data-tab');
        if (screens[target]) {
          screenContent.innerHTML = screens[target];
        }
      });
    });
  }

  // 3. Interactive ROI / Time Saver Calculator
  const clientSlider = document.getElementById('calc-clients-slider');
  const sliderValueText = document.getElementById('calc-clients-val');
  const hoursSavedText = document.getElementById('calc-hours-saved');
  const recoveredSlotsText = document.getElementById('calc-slots-recovered');
  const revenueGainedText = document.getElementById('calc-revenue-gained');

  if (clientSlider) {
    const updateCalculator = () => {
      const clientsPerDay = parseInt(clientSlider.value, 10);
      sliderValueText.textContent = `${clientsPerDay} clientes/dia`;

      // Calculations:
      // Approx 6 mins spent per manual WhatsApp interaction + confirmation + rescheduling
      const minutesPerWeek = clientsPerDay * 6 * 6; // 6 days
      const hoursSavedPerWeek = Math.round((minutesPerWeek / 60) * 10) / 10;
      
      // Automatic queue recovery recovers ~3 to 8 canceled slots per month
      const recoveredSlotsPerMonth = Math.round(clientsPerDay * 0.7);
      const estimatedGain = recoveredSlotsPerMonth * 45; // average ticket R$ 45

      hoursSavedText.textContent = `${hoursSavedPerWeek}h`;
      recoveredSlotsText.textContent = `+${recoveredSlotsPerMonth} vagas`;
      revenueGainedText.textContent = `+R$ ${estimatedGain}`;
    };

    clientSlider.addEventListener('input', updateCalculator);
    updateCalculator();
  }

  // 4. FAQ Accordion Toggle
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    question.addEventListener('click', () => {
      const isActive = item.classList.contains('active');
      faqItems.forEach(i => i.classList.remove('active'));
      if (!isActive) {
        item.classList.add('active');
      }
    });
  });
});
