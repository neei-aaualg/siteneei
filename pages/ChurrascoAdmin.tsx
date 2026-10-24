import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Flame,
  QrCode,
  Search,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Lock,
  LogOut,
  Camera,
  RefreshCw,
  UtensilsCrossed,
  Beer,
  User,
  Phone,
  Hash,
  ArrowLeft,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import {
  ChurrascoOrder,
  loginChurrascoAdmin,
  verifyChurrascoQrCode,
  serveChurrascoOrderItem,
} from '../services/churrascoService';

const BAR_TOKEN_KEY = 'neei_churrasco_bar_token';
const BAR_STAFF_NAME_KEY = 'neei_churrasco_bar_staff_name';

const ChurrascoAdmin: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const codeParam = searchParams.get('code') || searchParams.get('ticket') || searchParams.get('id') || '';

  // Auth State
  const [barToken, setBarToken] = useState<string | null>(() => {
    return typeof window !== 'undefined' ? localStorage.getItem(BAR_TOKEN_KEY) : null;
  });
  const [staffUsername, setStaffUsername] = useState<string>(() => {
    return typeof window !== 'undefined' ? localStorage.getItem(BAR_STAFF_NAME_KEY) || '' : '';
  });
  const [staffNameInput, setStaffNameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);

  // Ticket & Scan State
  const [inputCode, setInputCode] = useState(codeParam);
  const [activeOrder, setActiveOrder] = useState<ChurrascoOrder | null>(null);
  const [loadingTicket, setLoadingTicket] = useState(false);
  const [ticketError, setTicketError] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [processingAction, setProcessingAction] = useState<string | null>(null);

  // Camera Scanner State
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'churrasco-qr-reader';

  // Executa verificação inicial se houver código na URL e estiver autenticado
  useEffect(() => {
    if (barToken && codeParam) {
      handleLookup(codeParam);
    }
  }, [barToken, codeParam]);

  // Limpa scanner quando desmonta
  useEffect(() => {
    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    const trimmedName = staffNameInput.trim();
    if (!trimmedName || trimmedName.length < 2) {
      setAuthError('Por favor introduz o teu nome (mínimo 2 letras).');
      return;
    }

    if (!passwordInput.trim()) {
      setAuthError('Por favor introduz a senha do churrasco.');
      return;
    }

    setLoggingIn(true);
    try {
      const res = await loginChurrascoAdmin(passwordInput.trim(), trimmedName);
      const name = res.username || trimmedName;
      setBarToken(res.token);
      setStaffUsername(name);
      localStorage.setItem(BAR_TOKEN_KEY, res.token);
      localStorage.setItem(BAR_STAFF_NAME_KEY, name);
      setPasswordInput('');
      setStaffNameInput('');

      // Se havia código na query, pesquisa de imediato
      if (codeParam) {
        handleLookup(codeParam, res.token);
      }
    } catch (err: any) {
      setAuthError(err.message || 'Senha incorreta. Tenta novamente.');
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = () => {
    stopCamera();
    setBarToken(null);
    setStaffUsername('');
    localStorage.removeItem(BAR_TOKEN_KEY);
    localStorage.removeItem(BAR_STAFF_NAME_KEY);
    setActiveOrder(null);
    setTicketError(null);
  };

  const handleLookup = async (codeToSearch: string, tokenOverride?: string) => {
    const token = tokenOverride || barToken;
    if (!token) return;

    const trimmed = codeToSearch.trim();
    if (!trimmed) return;

    setLoadingTicket(true);
    setTicketError(null);
    setActionFeedback(null);

    try {
      const res = await verifyChurrascoQrCode(token, trimmed);
      if (res.valid && res.order) {
        setActiveOrder(res.order);
        // Atualiza a query string sem recarregar a página
        setSearchParams({ code: res.order.ticket_code || res.order.id });
        // Feedback sonoro/vibração se disponível
        try {
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(100);
          }
        } catch {}
      } else {
        setActiveOrder(null);
        setTicketError('Código QR não encontrado ou inválido.');
      }
    } catch (err: any) {
      setActiveOrder(null);
      setTicketError(err.message || 'Código não encontrado ou erro de ligação.');
    } finally {
      setLoadingTicket(false);
    }
  };

  const handleFormSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputCode.trim()) {
      handleLookup(inputCode.trim());
    }
  };

  // Iniciar Leitor de Câmara
  const startCamera = async () => {
    setCameraError(null);
    setIsCameraActive(true);

    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(scannerContainerId);
      }

      const qrCodeSuccessCallback = (decodedText: string) => {
        // Para a câmara após leitura bem sucedida
        stopCamera();
        setInputCode(decodedText);
        handleLookup(decodedText);
      };

      await scannerRef.current.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        qrCodeSuccessCallback,
        undefined
      );
    } catch (err: any) {
      console.error('[QR CAMERA ERROR]:', err);
      setCameraError('Não foi possível aceder à câmara. Verifica as permissões do browser.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
      } catch (err) {
        console.warn('[QR STOP WARN]:', err);
      }
    }
    setIsCameraActive(false);
  };

  // Servir item (bifana ou drink)
  const handleServeItem = async (item: 'bifana' | 'drink', action: 'serve' | 'undo' = 'serve') => {
    if (!barToken || !activeOrder) return;

    setProcessingAction(`${item}-${action}`);
    setActionFeedback(null);

    try {
      const res = await serveChurrascoOrderItem(
        barToken,
        activeOrder.id,
        item,
        action,
        staffUsername || 'Staff'
      );
      setActiveOrder(res.order);
      setActionFeedback(res.message);
      setTimeout(() => setActionFeedback(null), 3500);

      try {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate( action === 'serve' ? [80, 50, 80] : 50 );
        }
      } catch {}
    } catch (err: any) {
      setActionFeedback(`Erro: ${err.message || 'Falha ao atualizar consumo.'}`);
    } finally {
      setProcessingAction(null);
    }
  };

  const handleClearCurrent = () => {
    setActiveOrder(null);
    setInputCode('');
    setTicketError(null);
    setActionFeedback(null);
    setSearchParams({});
  };

  // ECRÃ 1: LOGIN COM NOME E SENHA DO CHURRASCO
  if (!barToken) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50/50 via-bg-100 to-bg-200 dark:from-[#0d1624] dark:via-[#09111b] dark:to-[#060b12] py-12 px-4 flex items-center justify-center">
        <div className="max-w-md w-full bg-white dark:bg-[#0c1724] border border-orange-200 dark:border-orange-950/70 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex p-3.5 rounded-2xl bg-orange-500 text-white shadow-md shadow-orange-500/25">
              <Flame size={28} />
            </div>
            <h1 className="text-2xl font-black text-text-100 dark:text-white">
              Churrasco Bar Staff
            </h1>
            <p className="text-xs sm:text-sm text-text-200 dark:text-slate-400">
              Acesso para voluntários e equipa de bar para validação de bilhetes e entrega de refeições.
            </p>
          </div>

          {authError && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs sm:text-sm flex items-center gap-2.5">
              <AlertCircle size={18} className="shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-text-200 dark:text-slate-300 mb-2">
                O teu Nome (Voluntário / Staff) *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  autoFocus
                  value={staffNameInput}
                  onChange={(e) => setStaffNameInput(e.target.value)}
                  placeholder="Ex: Diogo, João, Marta..."
                  className="w-full px-4 py-3 pl-10 rounded-xl bg-gray-50 dark:bg-[#09121d] border border-gray-200 dark:border-slate-800 text-text-100 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-text-200 dark:text-slate-300 mb-2">
                Senha do Balcão *
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Introduz a senha de staff..."
                  className="w-full px-4 py-3 pl-10 rounded-xl bg-gray-50 dark:bg-[#09121d] border border-gray-200 dark:border-slate-800 text-text-100 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
              <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-1">
                A senha de acesso é partilhada por toda a equipa do bar.
              </p>
            </div>

            <button
              type="submit"
              disabled={loggingIn}
              className="w-full py-3.5 px-4 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-sm shadow-md transition cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loggingIn ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>A verificar...</span>
                </>
              ) : (
                <>
                  <span>Entrar no Balcão</span>
                  <ChevronRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="pt-2 text-center border-t border-gray-100 dark:border-slate-800/80">
            <Link
              to="/churrasco"
              className="text-xs text-orange-600 dark:text-orange-400 font-semibold hover:underline inline-flex items-center gap-1"
            >
              <ArrowLeft size={12} />
              <span>Voltar à página do Churrasco</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ECRÃ 2: INTERFACE DE LEITURA & CONTROLO DE CONSUMO (CHURRASCO-ADMIN)
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#09111b] py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* BARRA SUPERIOR DO STAFF */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-[#0c1724] border border-gray-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-orange-500 text-white shadow-xs">
              <Flame size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-text-100 dark:text-white">
                  Balcão do Churrasco
                </span>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300">
                  Staff Ativo
                </span>
              </div>
              <span className="text-[11px] text-gray-500 dark:text-slate-400">
                Leitor & Controlo de Refeições
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-100 dark:bg-orange-950/70 text-orange-800 dark:text-orange-300 text-xs font-bold border border-orange-200 dark:border-orange-900/50">
              <User size={13} className="text-orange-600 dark:text-orange-400" />
              <span>{staffUsername || 'Voluntário'}</span>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="p-2 px-3 rounded-xl bg-gray-100 dark:bg-slate-800 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/50 dark:hover:text-red-400 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
              title="Terminar Sessão Staff"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>

        {/* FEEDBACK DE AÇÃO */}
        {actionFeedback && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 text-sm font-bold flex items-center justify-between shadow-xs animate-fadeIn">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{actionFeedback}</span>
            </div>
            <button
              type="button"
              onClick={() => setActionFeedback(null)}
              className="text-xs opacity-75 hover:opacity-100 px-2"
            >
              ✕
            </button>
          </div>
        )}

        {/* INPUT MANUAL E CÂMARA */}
        <div className="bg-white dark:bg-[#0c1724] border border-gray-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
          <form onSubmit={handleFormSearch} className="flex gap-2.5">
            <div className="relative flex-1">
              <input
                type="text"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                placeholder="Introduz código (ex: CH-FEAV) ou lê o QR..."
                className="w-full px-4 py-3 pl-10 rounded-2xl bg-gray-50 dark:bg-[#09121d] border border-gray-200 dark:border-slate-800 text-text-100 dark:text-white text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>

            <button
              type="submit"
              disabled={loadingTicket || !inputCode.trim()}
              className="px-5 py-3 rounded-2xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-sm shadow-xs transition disabled:opacity-50 cursor-pointer shrink-0"
            >
              {loadingTicket ? <RefreshCw size={18} className="animate-spin" /> : 'Verificar'}
            </button>

            <button
              type="button"
              onClick={isCameraActive ? stopCamera : startCamera}
              className={`p-3 rounded-2xl border transition shrink-0 cursor-pointer ${
                isCameraActive
                  ? 'bg-red-500 text-white border-red-500'
                  : 'bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-text-100 dark:text-white border-gray-200 dark:border-slate-700'
              }`}
              title={isCameraActive ? 'Desativar Câmara' : 'Ativar Câmara para ler QR'}
            >
              <Camera size={20} />
            </button>
          </form>

          {/* ÁREA DA CÂMARA QR */}
          {isCameraActive && (
            <div className="space-y-3 pt-2">
              <div className="relative rounded-2xl overflow-hidden border-2 border-dashed border-orange-400 dark:border-orange-500 bg-black flex justify-center items-center min-h-[260px]">
                <div id={scannerContainerId} className="w-full max-w-sm" />
              </div>
              <p className="text-center text-xs text-text-200 dark:text-slate-400">
                Aponta a câmara para o código QR do passe do estudante.
              </p>
            </div>
          )}

          {cameraError && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{cameraError}</span>
            </div>
          )}

          {ticketError && (
            <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm flex items-center gap-3">
              <XCircle size={20} className="shrink-0" />
              <div className="flex-1 font-semibold">{ticketError}</div>
              <button
                type="button"
                onClick={() => setTicketError(null)}
                className="text-xs font-bold px-2 py-1 underline"
              >
                Limpar
              </button>
            </div>
          )}
        </div>

        {/* DETALHES DO BILHETE E CONTROLO DE REFEIÇÃO */}
        {activeOrder && (
          <div className="bg-white dark:bg-[#0c1724] border-2 border-orange-300 dark:border-orange-500/50 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 animate-fadeIn">
            {/* CABEÇALHO DO ESTADO */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-gray-100 dark:border-slate-800 gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-2xl font-black text-orange-600 dark:text-orange-400 tracking-wider">
                    {activeOrder.ticket_code || activeOrder.ticketCode || activeOrder.id}
                  </span>

                  {activeOrder.payment_status === 'paid' ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 text-xs font-black uppercase tracking-wider">
                      <CheckCircle2 size={14} />
                      <span>Pago</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 dark:bg-red-950/70 text-red-700 dark:text-red-300 text-xs font-black uppercase tracking-wider">
                      <ShieldAlert size={14} />
                      <span>Pendente / Não Pago</span>
                    </span>
                  )}

                  {activeOrder.is_fully_served ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 text-xs font-black uppercase">
                      Tudo Entregue
                    </span>
                  ) : null}
                </div>

                <h2 className="text-xl sm:text-2xl font-extrabold text-text-100 dark:text-white mt-1">
                  {activeOrder.student_name || activeOrder.studentName}
                </h2>
              </div>

              <button
                type="button"
                onClick={handleClearCurrent}
                className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-xs font-bold text-gray-700 dark:text-slate-300 transition"
              >
                Próximo Bilhete ✕
              </button>
            </div>

            {/* DADOS DO ALUNO */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-gray-50 dark:bg-[#09121d] p-4 rounded-2xl border border-gray-100 dark:border-slate-800">
              <div>
                <span className="text-gray-400 dark:text-slate-500 block uppercase font-bold text-[10px]">
                  Passes Comprados
                </span>
                <span className="font-extrabold text-text-100 dark:text-white text-sm">
                  {activeOrder.quantity} passe{activeOrder.quantity > 1 ? 's' : ''} ({(activeOrder.quantity * 4.5).toFixed(2)}€)
                </span>
              </div>

              <div>
                <span className="text-gray-400 dark:text-slate-500 block uppercase font-bold text-[10px]">
                  Telemóvel
                </span>
                <span className="font-semibold text-text-100 dark:text-slate-200">
                  {activeOrder.phone_number || activeOrder.phoneNumber || 'N/D'}
                </span>
              </div>

              <div>
                <span className="text-gray-400 dark:text-slate-500 block uppercase font-bold text-[10px]">
                  Nº Aluno UAlg
                </span>
                <span className="font-semibold text-text-100 dark:text-slate-200">
                  {activeOrder.student_number || activeOrder.studentNumber || 'N/D'}
                </span>
              </div>

              <div>
                <span className="text-gray-400 dark:text-slate-500 block uppercase font-bold text-[10px]">
                  Email
                </span>
                <span className="font-semibold text-text-100 dark:text-slate-200 truncate block" title={activeOrder.student_email}>
                  {activeOrder.student_email || activeOrder.studentEmail || 'N/D'}
                </span>
              </div>
            </div>

            {/* CONTROLO DE ENTREGA: BIFANAS & BEBIDAS */}
            <div className="space-y-4">
              <h3 className="text-sm font-black uppercase tracking-wider text-text-100 dark:text-white flex items-center gap-2">
                <span>Itens a Servir</span>
                <span className="text-xs font-normal text-gray-500 dark:text-slate-400">
                  (Clica para abater após entregar ao estudante)
                </span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* CARTÃO BIFANAS */}
                <div className={`p-5 rounded-3xl border-2 transition-all ${
                  (activeOrder.bifanas_remaining ?? 0) === 0
                    ? 'bg-gray-50 dark:bg-slate-900/40 border-gray-200 dark:border-slate-800 opacity-80'
                    : 'bg-orange-50/70 dark:bg-orange-950/20 border-orange-300 dark:border-orange-500/50 shadow-sm'
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-2xl bg-orange-500 text-white shadow-xs">
                        <UtensilsCrossed size={24} />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-base text-text-100 dark:text-white">
                          Bifana no Pão
                        </h4>
                        <span className="text-xs text-text-200 dark:text-slate-400">
                          {activeOrder.bifanas_served ?? 0} de {activeOrder.bifanas_total ?? activeOrder.quantity} entregues
                        </span>
                      </div>
                    </div>

                    <span className={`text-xs font-black px-2.5 py-1 rounded-full uppercase ${
                      (activeOrder.bifanas_remaining ?? 0) === 0
                        ? 'bg-gray-200 dark:bg-slate-800 text-gray-600 dark:text-slate-400'
                        : 'bg-orange-500 text-white'
                    }`}>
                      {activeOrder.bifanas_remaining ?? 0} restante{(activeOrder.bifanas_remaining ?? 0) !== 1 ? 's' : ''}
                    </span>
                  </div>

                  <div className="mt-5 flex items-center gap-2.5">
                    <button
                      type="button"
                      disabled={
                        (activeOrder.bifanas_remaining ?? 0) <= 0 ||
                        processingAction === 'bifana-serve' ||
                        activeOrder.payment_status !== 'paid'
                      }
                      onClick={() => handleServeItem('bifana', 'serve')}
                      className="flex-1 py-3 px-4 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-extrabold text-sm shadow-sm transition disabled:opacity-40 cursor-pointer flex items-center justify-center gap-2"
                    >
                      {processingAction === 'bifana-serve' ? (
                        <RefreshCw size={16} className="animate-spin" />
                      ) : (
                        <span>Servir 1 Bifana</span>
                      )}
                    </button>

                    <button
                      type="button"
                      disabled={
                        (activeOrder.bifanas_served ?? 0) <= 0 ||
                        processingAction === 'bifana-undo'
                      }
                      onClick={() => handleServeItem('bifana', 'undo')}
                      className="py-3 px-3 rounded-xl bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-text-200 dark:text-slate-300 font-bold text-xs transition disabled:opacity-30 cursor-pointer"
                      title="Desfazer / repor 1 bifana"
                    >
                      -1
                    </button>
                  </div>
                </div>

                {/* CARTÃO BEBIDAS */}
                <div className={`p-5 rounded-3xl border-2 transition-all ${
                  (activeOrder.drinks_remaining ?? 0) === 0
                    ? 'bg-gray-50 dark:bg-slate-900/40 border-gray-200 dark:border-slate-800 opacity-80'
                    : 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-300 dark:border-amber-500/50 shadow-sm'
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-2xl bg-amber-500 text-white shadow-xs">
                        <Beer size={24} />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-base text-text-100 dark:text-white">
                          Copos de Bebida
                        </h4>
                        <span className="text-xs text-text-200 dark:text-slate-400">
                          {activeOrder.drinks_served ?? 0} de {activeOrder.drinks_total ?? (activeOrder.quantity * 2)} entregues
                        </span>
                      </div>
                    </div>

                    <span className={`text-xs font-black px-2.5 py-1 rounded-full uppercase ${
                      (activeOrder.drinks_remaining ?? 0) === 0
                        ? 'bg-gray-200 dark:bg-slate-800 text-gray-600 dark:text-slate-400'
                        : 'bg-amber-500 text-white'
                    }`}>
                      {activeOrder.drinks_remaining ?? 0} restante{(activeOrder.drinks_remaining ?? 0) !== 1 ? 's' : ''}
                    </span>
                  </div>

                  <div className="mt-5 flex items-center gap-2.5">
                    <button
                      type="button"
                      disabled={
                        (activeOrder.drinks_remaining ?? 0) <= 0 ||
                        processingAction === 'drink-serve' ||
                        activeOrder.payment_status !== 'paid'
                      }
                      onClick={() => handleServeItem('drink', 'serve')}
                      className="flex-1 py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-sm shadow-sm transition disabled:opacity-40 cursor-pointer flex items-center justify-center gap-2"
                    >
                      {processingAction === 'drink-serve' ? (
                        <RefreshCw size={16} className="animate-spin" />
                      ) : (
                        <span>Servir 1 Bebida</span>
                      )}
                    </button>

                    <button
                      type="button"
                      disabled={
                        (activeOrder.drinks_served ?? 0) <= 0 ||
                        processingAction === 'drink-undo'
                      }
                      onClick={() => handleServeItem('drink', 'undo')}
                      className="py-3 px-3 rounded-xl bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-text-200 dark:text-slate-300 font-bold text-xs transition disabled:opacity-30 cursor-pointer"
                      title="Desfazer / repor 1 bebida"
                    >
                      -1
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChurrascoAdmin;
