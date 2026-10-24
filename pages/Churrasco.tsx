import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Flame,
  CheckCircle,
  AlertCircle,
  UtensilsCrossed,
  Beer,
  MapPin,
  Calendar,
  Ticket,
  ShieldCheck,
  CreditCard,
  Printer,
  ChevronRight,
  Info,
  Users,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import QRCodeStyling from 'qr-code-styling';
import {
  fetchChurrascoStatus,
  checkoutChurrasco,
  fetchChurrascoOrder,
  confirmChurrascoPayment,
  ChurrascoOrder,
  ChurrascoStatusResponse,
} from '../services/churrascoService';

const Churrasco: React.FC = () => {
  const [searchParams] = useSearchParams();
  const isSuccessUrl = searchParams.get('success') === '1';
  const isCanceledUrl = searchParams.get('canceled') === '1';
  const orderIdParam = searchParams.get('order_id') || searchParams.get('orderId');
  const sessionIdParam = searchParams.get('session_id') || searchParams.get('sessionId');

  const [status, setStatus] = useState<ChurrascoStatusResponse | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);

  // Form State
  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [studentNumber, setStudentNumber] = useState('');
  const [drinkPreference] = useState('À escolha no dia');
  const [quantity, setQuantity] = useState(1);

  // Submission / Loading
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Success / Order State
  const [confirmedOrder, setConfirmedOrder] = useState<ChurrascoOrder | null>(null);
  const qrRef = useRef<HTMLDivElement>(null);
  const confirmingOrderIdRef = useRef<string | null>(null);

  // Carrega status da API
  useEffect(() => {
    fetchChurrascoStatus()
      .then((data) => setStatus(data))
      .finally(() => setLoadingStatus(false));
  }, []);

  // Trata redirecionamento de sucesso após Stripe Checkout
  useEffect(() => {
    if (isSuccessUrl && orderIdParam) {
      if (confirmingOrderIdRef.current === orderIdParam) {
        return;
      }
      confirmingOrderIdRef.current = orderIdParam;

      confirmChurrascoPayment(orderIdParam, sessionIdParam || undefined)
        .then((res) => {
          if (res.order) {
            setConfirmedOrder(res.order);
          } else {
            // Tenta obter os dados do pedido diretamente
            fetchChurrascoOrder(orderIdParam).then((ord) => {
              if (ord) setConfirmedOrder(ord);
            });
          }
        })
        .catch(() => {
          fetchChurrascoOrder(orderIdParam).then((ord) => {
            if (ord) setConfirmedOrder(ord);
          });
        });

      // Efeito de Confetti comemorativo
      try {
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#ea580c', '#f97316', '#fbbf24', '#06b6d4', '#10b981'],
        });
      } catch {
        // Fallback se confetti falhar
      }
    }
  }, [isSuccessUrl, orderIdParam, sessionIdParam]);

  // Gera código QR dinâmico quando a encomenda estiver confirmada
  useEffect(() => {
    if (confirmedOrder && qrRef.current) {
      qrRef.current.innerHTML = '';
      const ticketCode = confirmedOrder.ticket_code || confirmedOrder.ticketCode || confirmedOrder.id;
      const qrCode = new QRCodeStyling({
        width: 180,
        height: 180,
        type: 'svg',
        data:
          typeof window !== 'undefined'
            ? `${window.location.origin}/churrasco-admin?code=${ticketCode}`
            : `NEEI-CHURR:${ticketCode}`,
        dotsOptions: {
          color: '#9a3412',
          type: 'rounded',
        },
        backgroundOptions: {
          color: '#ffffff',
        },
        cornersSquareOptions: {
          color: '#ea580c',
          type: 'extra-rounded',
        },
      });
      qrCode.append(qrRef.current);
    }
  }, [confirmedOrder]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (studentName.trim().length < 3) {
      setErrorMsg('Por favor indica o teu nome completo (mínimo 3 letras).');
      return;
    }
    if (!studentEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(studentEmail)) {
      setErrorMsg('Por favor introduz um email de contacto válido.');
      return;
    }
    const cleanPhone = phoneNumber.replace(/\s+/g, '').replace(/^\+351/, '');
    if (!/^9\d{8}$/.test(cleanPhone)) {
      setErrorMsg('Número de telemóvel inválido (deve ter 9 dígitos e começar por 9).');
      return;
    }

    setSubmitting(true);
    try {
      const result = await checkoutChurrasco({
        student_name: studentName.trim(),
        student_email: studentEmail.trim(),
        phone_number: cleanPhone,
        student_number: studentNumber.trim() || undefined,
        drink_preference: drinkPreference,
        quantity,
      });

      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
      } else if (result.orderId) {
        // Fallback direto
        window.location.href = `/churrasco?success=1&order_id=${result.orderId}`;
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao processar a compra. Por favor tenta novamente.');
      setSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const unitPrice = status?.unitPrice || 4.5;
  const totalPrice = Number((unitPrice * quantity).toFixed(2));
  const isVisible = status ? status.visible : true;

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50/40 via-bg-100 to-bg-200 dark:from-[#0d1624] dark:via-[#09111b] dark:to-[#060b12] py-10 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-4xl mx-auto space-y-10">
        {/* Banner de Cancelamento se regressou da Stripe */}
        {isCanceledUrl && (
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              <AlertCircle size={20} className="text-amber-600 dark:text-amber-400 shrink-0" />
              <p className="text-sm font-medium">
                O pagamento foi cancelado. Podes voltar a tentar quando quiseres!
              </p>
            </div>
            <Link
              to="/churrasco"
              className="text-xs font-bold underline hover:no-underline px-2 py-1"
            >
              Fechar
            </Link>
          </div>
        )}

        {/* ECRÃ DE SUCESSO / BILHETE DIGITAL CONFIRMADO */}
        {confirmedOrder ? (
          <section className="bg-white dark:bg-[#0d1b2a] rounded-3xl p-6 sm:p-10 border border-orange-200 dark:border-orange-950/60 shadow-xl space-y-8 animate-fadeIn">
            <div className="text-center space-y-3">
              <div className="inline-flex p-3 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                <CheckCircle size={36} />
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-text-100 dark:text-white">
                O teu Passe está Confirmado!
              </h1>
              <p className="text-sm sm:text-base text-text-200 dark:text-slate-300 max-w-lg mx-auto">
                Obrigado, <span className="font-bold text-orange-600 dark:text-orange-400">{confirmedOrder.student_name || confirmedOrder.studentName}</span>. O comprovativo foi enviado para o teu email. Apresenta o código ou o QR code no balcão no dia do convívio.
              </p>
            </div>

            {/* Cartão do Bilhete Digital */}
            <div className="max-w-md mx-auto bg-gradient-to-br from-orange-50 via-white to-amber-50 dark:from-[#0a1523] dark:via-[#0c1827] dark:to-[#112235] border-2 border-dashed border-orange-400 dark:border-orange-500/60 rounded-3xl p-6 sm:p-8 shadow-lg text-center relative overflow-hidden print:border-solid print:border-black">
              {/* Carimbo de Evento */}
              <div className="flex items-center justify-between pb-4 border-b border-orange-200 dark:border-orange-900/40">
                <div className="flex items-center gap-2">
                  <Flame size={20} className="text-orange-500" />
                  <span className="font-extrabold text-sm uppercase tracking-wider text-orange-700 dark:text-orange-400">
                    Churrasco NEEI
                  </span>
                </div>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Pago com Sucesso
                </span>
              </div>

              {/* Código em destaque */}
              <div className="py-6 space-y-1">
                <span className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest">
                  Código de Entrada
                </span>
                <div className="text-4xl sm:text-5xl font-black text-orange-600 dark:text-orange-400 tracking-wider">
                  {confirmedOrder.ticket_code || confirmedOrder.ticketCode || confirmedOrder.id}
                </div>
              </div>

              {/* QR Code Container */}
              <div className="flex justify-center py-2">
                <div
                  ref={qrRef}
                  className="p-3 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center min-h-[190px] min-w-[190px]"
                />
              </div>

              {/* Resumo do Bilhete */}
              <div className="mt-6 pt-4 border-t border-orange-200 dark:border-orange-900/40 text-left space-y-2 text-xs sm:text-sm text-text-200 dark:text-slate-300">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-slate-400">Passe Inclui:</span>
                  <span className="font-bold text-text-100 dark:text-white">1 Bifana + 2 Bebidas</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-slate-400">Bebidas:</span>
                  <span className="font-semibold">2 copos (cerveja, refrigerante ou água)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-slate-400">Quantidade:</span>
                  <span className="font-semibold">{confirmedOrder.quantity} passe(s)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-slate-400">Total Pago:</span>
                  <span className="font-bold text-orange-600 dark:text-orange-400">{Number(confirmedOrder.total_amount || confirmedOrder.totalAmount || unitPrice).toFixed(2)}€</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-slate-400">Local:</span>
                  <span className="font-medium">Campus de Gambelas</span>
                </div>
              </div>
            </div>

            {/* Ações */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 print:hidden">
              <button
                type="button"
                onClick={handlePrint}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-sm shadow-md transition cursor-pointer"
              >
                <Printer size={16} />
                <span>Imprimir / Guardar Bilhete</span>
              </button>
              <Link
                to="/"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-text-100 dark:text-white font-semibold text-sm transition"
              >
                <span>Voltar ao Início</span>
              </Link>
            </div>
          </section>
        ) : (
          <>
            {/* HERO PRINCIPAL DO CHURRASCO */}
            <header className="text-center space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-500/10 dark:bg-orange-500/20 text-orange-600 dark:text-orange-300 border border-orange-300 dark:border-orange-500/30 text-xs font-semibold tracking-wide">
                <Flame size={14} className="text-orange-500" />
                <span>NEEI &bull; Entrada Gratuita</span>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-text-100 dark:text-white tracking-tight">
                Churrasco de <br className="hidden sm:inline" />
                <span className="bg-gradient-to-r from-orange-500 via-amber-500 to-red-500 bg-clip-text text-transparent">
                  Engenharia Informática
                </span>
              </h1>

              <p className="text-base sm:text-lg text-text-200 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
                Organizado pelo <strong>NEEI</strong> em colaboração com o <strong>NEISE</strong>. Entrada livre e aberta a todos os estudantes da Universidade do Algarve!
              </p>
            </header>

            {/* BANNER EM DESTAQUE: ENTRADA GRATUITA VS PASSE OPCIONAL */}
            <div className="p-5 sm:p-6 rounded-3xl bg-emerald-500/10 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-500/40 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4 text-center md:text-left">
                <div className="p-3 rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20 shrink-0 hidden sm:flex">
                  <Info size={22} />
                </div>
                <div>
                  <div className="flex items-center justify-center md:justify-start gap-2 flex-wrap">
                    <span className="text-base sm:text-lg font-bold text-emerald-950 dark:text-emerald-100">
                      Entrada Livre para Todos
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-emerald-900/90 dark:text-emerald-200 mt-1">
                    A entrada no espaço do convívio é livre e não requer qualquer pagamento. Encontra-se disponível o nosso passe com <strong>1 bifana no pão + 2 copos de bebida</strong> (cerveja, refrigerante ou água à escolha no bar) por apenas <strong>4,50€</strong>.
                  </p>
                </div>
              </div>

              <div className="shrink-0 text-center md:text-right bg-white dark:bg-[#0c1827] p-3 px-4 rounded-2xl border border-emerald-300/80 dark:border-emerald-500/40 shadow-xs">
                <span className="text-[11px] font-semibold text-gray-500 dark:text-slate-400 block uppercase tracking-wide">
                  Passe Refeição (Opcional)
                </span>
                <span className="text-xl sm:text-2xl font-black text-orange-600 dark:text-orange-400">
                  4,50€
                </span>
              </div>
            </div>

            {/* DESTAQUES DO QUE ESTÁ INCLUÍDO NO PASSE (4,50€) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-white dark:bg-[#0c1724] border border-orange-200/80 dark:border-orange-950/60 shadow-xs flex items-start gap-3.5">
                <div className="p-2.5 rounded-xl bg-orange-100 dark:bg-orange-950/80 text-orange-600 dark:text-orange-400 shrink-0">
                  <UtensilsCrossed size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-text-100 dark:text-white text-sm sm:text-base">
                    1 Bifana no Pão
                  </h3>
                  <p className="text-xs text-text-200 dark:text-slate-400 mt-0.5">
                    Grelhada na hora. Opção vegetariana disponível mediante pedido no balcão.
                  </p>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-[#0c1724] border border-orange-200/80 dark:border-orange-950/60 shadow-xs flex items-start gap-3.5">
                <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 shrink-0">
                  <Beer size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-text-100 dark:text-white text-sm sm:text-base">
                    2 Copos de Bebida
                  </h3>
                  <p className="text-xs text-text-200 dark:text-slate-400 mt-0.5">
                    Cerveja fresca, refrigerante ou água à tua escolha no bar.
                  </p>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-[#0c1724] border border-orange-200/80 dark:border-orange-950/60 shadow-xs flex items-start gap-3.5">
                <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 shrink-0">
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-text-100 dark:text-white text-sm sm:text-base">
                    4,50€ Tudo Incluído
                  </h3>
                  <p className="text-xs text-text-200 dark:text-slate-400 mt-0.5">
                    Levanta a tua pulseira no dia.
                  </p>
                </div>
              </div>
            </div>

            {/* SE O CHURRASCO ESTIVER OCULTO OU DESATIVADO PELO ADMIN */}
            {!isVisible ? (
              <div className="bg-white dark:bg-[#0d1b2a] rounded-3xl p-8 sm:p-12 border border-gray-200 dark:border-slate-800 text-center space-y-4 shadow-sm">
                <div className="inline-flex p-3 rounded-full bg-orange-100 dark:bg-orange-950/70 text-orange-600 dark:text-orange-400">
                  <Info size={32} />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-text-100 dark:text-white">
                  Inscrições Temporariamente Encerradas
                </h2>
                <p className="text-sm text-text-200 dark:text-slate-300 max-w-md mx-auto">
                  A venda de bilhetes para o churrasco encontra-se suspensa no momento. Fica atento ao nosso Instagram{' '}
                  <a
                    href="https://instagram.com/neeiualg"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-orange-600 dark:text-orange-400 underline"
                  >
                    @neeiualg
                  </a>{' '}
                  para próximas novidades e reabertura!
                </p>
                <div className="pt-2">
                  <Link
                    to="/"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-100 dark:bg-slate-800 text-sm font-semibold hover:bg-gray-200 dark:hover:bg-slate-700 transition"
                  >
                    Voltar ao Portal NEEI
                  </Link>
                </div>
              </div>
            ) : (
              /* FORMULÁRIO DE COMPRA DO PASSE */
              <div className="bg-white dark:bg-[#0c1724] rounded-3xl border border-orange-200 dark:border-orange-950/70 shadow-xl p-6 sm:p-10 space-y-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-gray-100 dark:border-slate-800/80 gap-3">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-text-100 dark:text-white flex items-center gap-2 flex-wrap">
                      <span>Comprar Passe de Refeição</span>
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300">
                        Entrada Grátis
                      </span>
                    </h2>
                    <p className="text-xs sm:text-sm text-text-200 dark:text-slate-400 mt-1">
                      A entrada no convívio é livre e aberta a todos. Adquire aqui o teu passe para garantires 1 bifana no pão e 2 copos de bebida.
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-slate-500">
                      Preço por Passe
                    </span>
                    <div className="text-2xl font-black text-orange-600 dark:text-orange-400">
                      4,50€
                    </div>
                  </div>
                </div>

                {errorMsg && (
                  <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm flex items-center gap-3">
                    <AlertCircle size={18} className="shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {/* Nome Completo */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-text-200 dark:text-slate-300 mb-2">
                        Nome Completo <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={studentName}
                        onChange={(e) => setStudentName(e.target.value)}
                        placeholder="Ex: David Rodrigues"
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#09121d] border border-gray-200 dark:border-cyan-950/80 text-text-100 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-text-200 dark:text-slate-300 mb-2">
                        Email (para envio do bilhete) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={studentEmail}
                        onChange={(e) => setStudentEmail(e.target.value)}
                        placeholder="a79994@ualg.pt ou pessoal"
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#09121d] border border-gray-200 dark:border-cyan-950/80 text-text-100 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                      />
                    </div>

                    {/* Telemóvel */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-text-200 dark:text-slate-300 mb-2">
                        Telemóvel <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        maxLength={12}
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="912 345 678"
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#09121d] border border-gray-200 dark:border-cyan-950/80 text-text-100 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                      />
                    </div>

                    {/* Número de Aluno (Opcional) */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-text-200 dark:text-slate-300 mb-2">
                        Nº de Aluno UAlg <span className="text-gray-400 font-normal lowercase">(opcional)</span>
                      </label>
                      <input
                        type="text"
                        value={studentNumber}
                        onChange={(e) => setStudentNumber(e.target.value)}
                        placeholder="Ex: a74123"
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#09121d] border border-gray-200 dark:border-cyan-950/80 text-text-100 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                      />
                    </div>
                  </div>

                  {/* Quantidade de Passes */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-orange-50/50 dark:bg-orange-950/20 border border-orange-200/60 dark:border-orange-900/40 gap-4">
                    <div>
                      <span className="font-bold text-sm text-text-100 dark:text-white block">
                        Quantidade de Passes
                      </span>
                      <span className="text-xs text-text-200 dark:text-slate-400">
                        Podes adquirir passes para ti e colegas na mesma compra.
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                        disabled={quantity <= 1}
                        className="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 text-text-100 dark:text-white font-bold border border-gray-200 dark:border-slate-700 hover:bg-gray-100 disabled:opacity-40 transition cursor-pointer flex items-center justify-center text-lg"
                      >
                        -
                      </button>
                      <span className="font-extrabold text-base min-w-[28px] text-center text-text-100 dark:text-white">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => setQuantity((prev) => Math.min(10, prev + 1))}
                        disabled={quantity >= 10}
                        className="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 text-text-100 dark:text-white font-bold border border-gray-200 dark:border-slate-700 hover:bg-gray-100 disabled:opacity-40 transition cursor-pointer flex items-center justify-center text-lg"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Resumo & Botão de Checkout */}
                  <div className="pt-4 border-t border-gray-100 dark:border-slate-800 space-y-4">
                    <div className="flex items-center justify-between text-sm sm:text-base">
                      <span className="font-semibold text-text-200 dark:text-slate-300">
                        Total a Pagar ({quantity}x passe{quantity > 1 ? 's' : ''}):
                      </span>
                      <span className="text-2xl font-black text-orange-600 dark:text-orange-400">
                        {totalPrice.toFixed(2)}€
                      </span>
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full py-4 px-6 rounded-2xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-base sm:text-lg shadow-md hover:shadow-lg transition-all duration-150 cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2.5"
                    >
                      {submitting ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>A redirecionar para pagamento...</span>
                        </>
                      ) : (
                        <>
                          <Ticket size={20} />
                          <span>Comprar Passe &bull; {totalPrice.toFixed(2)}€</span>
                          <ChevronRight size={18} />
                        </>
                      )}
                    </button>

                    <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-gray-500 dark:text-slate-400 pt-1">
                      <div className="flex items-center gap-1.5">
                        <ShieldCheck size={14} className="text-emerald-500" />
                        <span>Pagamento Seguro via Stripe</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CreditCard size={14} />
                        <span>MB Way, Cartão, Apple Pay & Google Pay</span>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            )}

            {/* Informações de Localização, Horário e Organização */}
            <div className="p-6 rounded-3xl bg-gray-50 dark:bg-[#0c1724]/60 border border-gray-200/80 dark:border-slate-800/80 text-xs sm:text-sm text-text-200 dark:text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <MapPin size={18} className="text-orange-500 shrink-0" />
                <span>Campus de Gambelas, junto ao Edifício 1 (ISE)</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-orange-500 shrink-0" />
                <span>A partir das 17h00</span>
              </div>
              <div className="flex items-center gap-2 font-medium text-text-100 dark:text-slate-200">
                <Users size={18} className="text-orange-500 shrink-0" />
                <span>Organização conjunta NEEI &times; NEISE</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Churrasco;
