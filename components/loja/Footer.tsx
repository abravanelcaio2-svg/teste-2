'use client'

import { useState } from 'react'
import Link from 'next/link'

// SVG logos das bandeiras de cartão — viewBox 60x38 = proporção real de cartão
function PixIcon() {
  return (
    <svg viewBox="0 0 60 38" xmlns="http://www.w3.org/2000/svg" style={{width:'100%',height:'100%',display:'block'}}>
      <rect width="60" height="38" rx="3" fill="#32BCAD"/>
      <path d="M30 7l7 7-7 7-7-7L30 7zm0 17l7 7-7 7-7-7L30 24zm-11-8.5L12.5 19l6.5 6.5 6.5-6.5-6.5-6.5zm22 0L34.5 19l6.5 6.5 6.5-6.5-6.5-6.5z" fill="white"/>
    </svg>
  )
}
function VisaIcon() {
  return (
    <svg viewBox="0 0 60 38" xmlns="http://www.w3.org/2000/svg" style={{width:'100%',height:'100%',display:'block'}}>
      <rect width="60" height="38" rx="3" fill="#1A1F71"/>
      <text x="6" y="26" fontSize="16" fontWeight="bold" fill="white" fontFamily="Arial,sans-serif">VISA</text>
    </svg>
  )
}
function MasterIcon() {
  return (
    <svg viewBox="0 0 60 38" xmlns="http://www.w3.org/2000/svg" style={{width:'100%',height:'100%',display:'block'}}>
      <rect width="60" height="38" rx="3" fill="#252525"/>
      <circle cx="22" cy="19" r="11" fill="#EB001B"/>
      <circle cx="38" cy="19" r="11" fill="#F79E1B"/>
      <path d="M30 10.4a11 11 0 0 1 0 17.2 11 11 0 0 1 0-17.2z" fill="#FF5F00"/>
    </svg>
  )
}
function EloIcon() {
  return (
    <svg viewBox="0 0 60 38" xmlns="http://www.w3.org/2000/svg" style={{width:'100%',height:'100%',display:'block'}}>
      <rect width="60" height="38" rx="3" fill="#FFD100"/>
      <text x="8" y="26" fontSize="15" fontWeight="900" fill="#000" fontFamily="Arial,sans-serif">elo</text>
    </svg>
  )
}
function AmexIcon() {
  return (
    <svg viewBox="0 0 60 38" xmlns="http://www.w3.org/2000/svg" style={{width:'100%',height:'100%',display:'block'}}>
      <rect width="60" height="38" rx="3" fill="#2E77BC"/>
      <text x="5" y="25" fontSize="11" fontWeight="bold" fill="white" fontFamily="Arial,sans-serif">AMEX</text>
    </svg>
  )
}
function HiperIcon() {
  return (
    <svg viewBox="0 0 60 38" xmlns="http://www.w3.org/2000/svg" style={{width:'100%',height:'100%',display:'block'}}>
      <rect width="60" height="38" rx="3" fill="#E31B23"/>
      <text x="5" y="24" fontSize="11" fontWeight="bold" fill="white" fontFamily="Arial,sans-serif">HIPER</text>
    </svg>
  )
}
function BoletoIcon() {
  return (
    <svg viewBox="0 0 60 38" xmlns="http://www.w3.org/2000/svg" style={{width:'100%',height:'100%',display:'block'}}>
      <rect width="60" height="38" rx="3" fill="#fff" stroke="#ddd"/>
      <rect x="7" y="8" width="3" height="22" fill="#000"/>
      <rect x="12" y="8" width="1.5" height="22" fill="#000"/>
      <rect x="15" y="8" width="3" height="22" fill="#000"/>
      <rect x="20" y="8" width="1.5" height="22" fill="#000"/>
      <rect x="23" y="8" width="4" height="22" fill="#000"/>
      <rect x="29" y="8" width="1.5" height="22" fill="#000"/>
      <rect x="32" y="8" width="3" height="22" fill="#000"/>
      <rect x="37" y="8" width="1.5" height="22" fill="#000"/>
      <rect x="40" y="8" width="3" height="22" fill="#000"/>
      <rect x="45" y="8" width="1.5" height="22" fill="#000"/>
      <rect x="48" y="8" width="3" height="22" fill="#000"/>
    </svg>
  )
}

export default function Footer() {
  const [email, setEmail] = useState('')

  function handleNewsletter(e: React.FormEvent) {
    e.preventDefault()
    setEmail('')
    alert('Cadastrado com sucesso!')
  }

  return (
    <>
      {/* Newsletter */}
      <section className="newsletter-section">
        <div className="newsletter-inner">
          <div className="newsletter-texto">
            <h2>Aproveite nossas promoções!</h2>
            <p>Cadastre seu e-mail e receba ofertas exclusivas</p>
          </div>
          <form className="newsletter-form" onSubmit={handleNewsletter}>
            <input type="email" placeholder="Digite seu e-mail" value={email} onChange={e => setEmail(e.target.value)} required/>
            <button type="submit">QUERO RECEBER</button>
          </form>
        </div>
      </section>

      {/* Trust bar */}
      <div className="trust-bar">
        <div className="trust-bar-inner">
          <div className="trust-item">
            <svg width="28" height="28" fill="none" viewBox="0 0 24 24">
              <rect x="2" y="5" width="20" height="14" rx="2" stroke="#0D71F0" strokeWidth="1.8"/>
              <path d="M2 10h20" stroke="#0D71F0" strokeLinecap="round" strokeWidth="1.8"/>
            </svg>
            <div><p>Pague em até</p><p><span className="highlight">12x</span> no cartão</p></div>
          </div>
          <div className="trust-item">
            <svg width="28" height="28" fill="none" viewBox="0 0 24 24">
              <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3" stroke="#0D71F0" strokeLinecap="round" strokeWidth="1.8"/>
              <rect x="9" y="11" width="14" height="10" rx="2" stroke="#0D71F0" strokeWidth="1.8"/>
              <circle cx="16" cy="16" r="1" fill="#0D71F0"/>
            </svg>
            <div><p>Entregamos em</p><p><span className="highlight">todo Brasil!</span></p></div>
          </div>
          <div className="trust-item">
            <svg width="28" height="28" fill="none" viewBox="0 0 24 24">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="#0D71F0" strokeLinecap="round" strokeWidth="1.8"/>
            </svg>
            <div><p>Compra</p><p><span className="highlight">100% segura!</span></p></div>
          </div>
          <div className="trust-item">
            <svg width="28" height="28" fill="none" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="#0D71F0" strokeWidth="1.8"/>
              <path d="M12 8v4l3 3" stroke="#0D71F0" strokeLinecap="round" strokeWidth="1.8"/>
            </svg>
            <div><p>Anos de</p><p><span className="highlight">história</span></p></div>
          </div>
        </div>
      </div>

      {/* Main footer */}
      <footer className="gazin-footer">
        <div className="footer-top">
          <div className="footer-atendimento">
            <div className="flex items-center gap-2">
              <svg width="20" height="20" fill="none" viewBox="0 0 20 20">
                <path clipRule="evenodd" d="M13.6 14.2c.4.3.4.9,0,1.2l-1,.8c-.4.3-1.2.5-1.7.3 0,0-2.1-.4-4.6-2.9C3.8 11.1 3.4 9.1 3.4 9.1 3.2 8.5 3.4 7.8 3.7 7.4l.8-1c.3-.4.9-.4 1.2 0L6.9 7.9c.2.3.2.7 0 1L6.3 9.7s0 1.4 1.1 2.5c1.1 1.1 2.5 1.1 2.5 1.1l.8-.5c.3-.2.8-.2 1 0L13.6 14.2Z" fillRule="evenodd" stroke="#0D71F0" strokeLinecap="round" strokeWidth="1.5"/>
              </svg>
              <span className="text-sm font-semibold text-gazin-dark">Atendimento</span>
            </div>
            <a href="tel:08006436809" className="telefone">0800 643 6809</a>
            <div className="horarios">
              <span>Segunda à sexta das 08:00 h às 19:00 h</span>
              <span>Sábado das 08:00 h às 16:00 h</span>
              <span>Domingo e feriados das 08:00 h às 14:00 h</span>
            </div>
          </div>

          <nav className="footer-nav">
            <div className="footer-nav-col">
              <h3>Institucional</h3>
              <ul>
                <li><Link href="/pagina/a-empresa">A empresa</Link></li>
                <li><Link href="/pagina/nossas-lojas">Nossas lojas</Link></li>
                <li><Link href="/pagina/trabalhe-conosco">Trabalhe conosco</Link></li>
              </ul>
            </div>
            <div className="footer-nav-col">
              <h3>Dúvidas</h3>
              <ul>
                <li><Link href="/pagina/como-comprar">Como comprar</Link></li>
                <li><Link href="/pagina/formas-de-pagamento">Formas de pagamento</Link></li>
                <li><Link href="/minha-conta/pedidos">Acompanhar pedido</Link></li>
                <li><Link href="/pagina/troca-e-devolucao">Troca e devolução</Link></li>
                <li><Link href="/pagina/politica-de-entrega">Política de Entrega</Link></li>
                <li><Link href="/pagina/privacidade-e-seguranca">Privacidade e Segurança</Link></li>
              </ul>
            </div>
            <div className="footer-nav-col">
              <h3>Categorias</h3>
              <ul>
                <li><Link href="/categoria/celulares-e-smartphones">Celulares</Link></li>
                <li><Link href="/categoria/eletrodomesticos">Eletrodomésticos</Link></li>
                <li><Link href="/categoria/tvs-e-video">TV e Vídeo</Link></li>
                <li><Link href="/categoria/moveis">Móveis</Link></li>
                <li><Link href="/categoria/informatica">Informática</Link></li>
                <li><Link href="/categoria/ar-e-ventilacao">Ar e Ventilação</Link></li>
                <li><Link href="/categoria/eletroportateis">Eletroportáteis</Link></li>
                <li><Link href="/categoria/colchoes-e-acessorios">Colchões</Link></li>
              </ul>
            </div>
            <div className="footer-nav-col">
              <h3>Redes Sociais</h3>
              <ul>
                <li><a href="#" className="flex items-center gap-2"><svg width="16" height="16" fill="#0D71F0" viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>Facebook</a></li>
                <li><a href="#" className="flex items-center gap-2"><svg width="16" height="16" fill="none" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5" stroke="#0D71F0" strokeWidth="1.8"/><circle cx="12" cy="12" r="4" stroke="#0D71F0" strokeWidth="1.8"/><circle cx="17.5" cy="6.5" r="1" fill="#0D71F0"/></svg>Instagram</a></li>
                <li><a href="#" className="flex items-center gap-2"><svg width="16" height="16" fill="#0D71F0" viewBox="0 0 24 24"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/><polygon fill="white" points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"/></svg>YouTube</a></li>
              </ul>
            </div>
          </nav>
        </div>

        {/* Payment */}
        <div className="footer-payment">
          <div>
            <h3>Formas de Pagamento</h3>
            <div className="payment-icons">
              <div className="payment-card-icon"><PixIcon/></div>
              <div className="payment-card-icon"><VisaIcon/></div>
              <div className="payment-card-icon"><MasterIcon/></div>
              <div className="payment-card-icon"><EloIcon/></div>
              <div className="payment-card-icon"><AmexIcon/></div>
              <div className="payment-card-icon"><HiperIcon/></div>
              <div className="payment-card-icon"><BoletoIcon/></div>
            </div>
          </div>
          <div className="footer-trust">
            <div className="trust-badge">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="#6BB70B" strokeLinecap="round" strokeWidth="1.8"/>
                <path d="M9 12l2 2 4-4" stroke="#6BB70B" strokeLinecap="round" strokeWidth="1.8"/>
              </svg>
              <span>Site Seguro</span>
            </div>
            <div className="trust-badge">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="#6BB70B" strokeLinecap="round" strokeWidth="1.8"/>
              </svg>
              <span>SSL Certificado</span>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} Gazin. Todos os direitos reservados. CNPJ: 00.000.000/0001-00</p>
          <p className="mt-1 text-xs opacity-70">Os preços e condições de pagamento são exclusivos para compras via internet.</p>
        </div>
      </footer>
    </>
  )
}
