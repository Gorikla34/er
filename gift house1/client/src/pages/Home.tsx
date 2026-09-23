import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  BadgeCheck,
  ChevronRight,
  CircleHelp,
  Crown,
  Gem,
  Gift,
  Home as HomeIcon,
  Menu,
  Plus,
  Repeat2,
  Search,
  ShieldCheck,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  Star,
  UserRound,
  WalletCards,
  X,
  Zap,
} from "lucide-react";
import { useTonConnectUI, useTonWallet } from "@tonconnect/ui-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

type GiftItem = {
  id: string;
  name: string;
  collection: string;
  image: string;
  stars: number;
  ton: string;
  available: string;
  icon: string;
  accent: string;
  rarity: "Rare" | "Limited" | "Common";
};

type TelegramUser = {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
};

type TelegramWebApp = {
  ready: () => void;
  expand: () => void;
  initDataUnsafe?: { user?: TelegramUser };
};

const gifts: GiftItem[] = [
  { id: "plush-pepe", name: "Plush Pepe", collection: "Telegram Collectible", image: "https://nft.fragment.com/gift/plushpepe-1.medium.jpg", stars: 100, ton: "0.32", available: "1 248", icon: "♣", accent: "pepe", rarity: "Rare" },
  { id: "durovs-cap", name: "Durov's Cap", collection: "Telegram Collectible", image: "https://nft.fragment.com/gift/durovscap-1.medium.jpg", stars: 150, ton: "0.98", available: "426", icon: "♛", accent: "cap", rarity: "Limited" },
  { id: "heart-locket", name: "Heart Locket", collection: "Telegram Collectible", image: "https://nft.fragment.com/gift/heartlocket-1.medium.jpg", stars: 75, ton: "0.18", available: "2 904", icon: "♥", accent: "heart", rarity: "Common" },
  { id: "loot-bag", name: "Loot Bag", collection: "Telegram Collectible", image: "https://nft.fragment.com/gift/lootbag-1.medium.jpg", stars: 90, ton: "0.13", available: "3 611", icon: "◆", accent: "loot", rarity: "Common" },
  { id: "toy-bear", name: "Toy Bear", collection: "Telegram Collectible", image: "https://nft.fragment.com/gift/toybear-1.medium.jpg", stars: 110, ton: "0.41", available: "1 090", icon: "✦", accent: "bear", rarity: "Rare" },
  { id: "jelly-bunny", name: "Jelly Bunny", collection: "Telegram Collectible", image: "https://nft.fragment.com/gift/jellybunny-1.medium.jpg", stars: 125, ton: "0.58", available: "642", icon: "◒", accent: "bunny", rarity: "Rare" },
  { id: "magic-potion", name: "Magic Potion", collection: "Telegram Collectible", image: "https://nft.fragment.com/gift/magicpotion-1.medium.jpg", stars: 145, ton: "0.75", available: "310", icon: "✧", accent: "potion", rarity: "Limited" },
  { id: "candy-cane", name: "Candy Cane", collection: "Telegram Collectible", image: "https://nft.fragment.com/gift/candycane-1.medium.jpg", stars: 85, ton: "0.22", available: "2 184", icon: "❋", accent: "candy", rarity: "Common" },
];

const categories = ["Все", "Редкие", "Лимитированные", "До 100 ⭐"];
const navItems = [
  { id: "home", label: "Главная", Icon: HomeIcon },
  { id: "store", label: "Магазин", Icon: ShoppingBag },
  { id: "market", label: "Маркет", Icon: Repeat2 },
  { id: "profile", label: "Профиль", Icon: UserRound },
] as const;

function GiftArtwork({ gift, large = false }: { gift: GiftItem; large?: boolean }) {
  return (
    <div className={`gift-art gift-art-${gift.accent} ${large ? "gift-art-large" : ""}`} aria-label={gift.name}>
      <div className="gift-art-glow" />
      <div className="gift-art-rarity">{gift.rarity === "Limited" ? "LIMITED" : gift.rarity === "Rare" ? "RARE" : "COLLECTIBLE"}</div>
      <img className="gift-art-image" src={gift.image} alt="" />
      <span className="gift-art-symbol">{gift.icon}</span>
      <div className="gift-art-shine" />
    </div>
  );
}

function StarsMark({ amount, compact = false }: { amount: number; compact?: boolean }) {
  return <span className={`stars-mark ${compact ? "stars-mark-compact" : ""}`}><Star size={compact ? 12 : 14} fill="currentColor" /> {amount}</span>;
}

function formatTonAddress(address?: string) {
  if (!address) return "";
  return `${address.slice(0, 5)}…${address.slice(-4)}`;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState("home");
  const [telegramUser, setTelegramUser] = useState<TelegramUser | null>(null);
  const [category, setCategory] = useState("Все");
  const [query, setQuery] = useState("");
  const [selectedGift, setSelectedGift] = useState<GiftItem | null>(null);
  const [topUpMode, setTopUpMode] = useState<"stars" | "ton" | null>(null);
  const [starsAmount, setStarsAmount] = useState(100);
  const [tonConnectUI] = useTonConnectUI();
  const tonWallet = useTonWallet();
  const createInvoice = trpc.payments.createStarsInvoice.useMutation();

  const changeTab = (tab: string) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: "auto" });
  };

  useEffect(() => {
    const webApp = (window as Window & { Telegram?: { WebApp?: TelegramWebApp } }).Telegram?.WebApp;
    webApp?.ready();
    webApp?.expand();
    setTelegramUser(webApp?.initDataUnsafe?.user ?? null);
  }, []);

  const profileName = telegramUser?.first_name
    ? `${telegramUser.first_name}${telegramUser.last_name ? ` ${telegramUser.last_name}` : ""}`
    : "Ваш профиль";
  const profileHandle = telegramUser?.username ? `@${telegramUser.username}` : `Telegram ID: ${telegramUser?.id ?? "—"}`;
  const profileInitials = telegramUser?.first_name?.slice(0, 1).toUpperCase() ?? "TG";

  const filteredGifts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return gifts.filter((gift) => {
      const matchesQuery = !normalizedQuery || gift.name.toLowerCase().includes(normalizedQuery);
      const matchesCategory = category === "Все"
        || (category === "Редкие" && gift.rarity === "Rare")
        || (category === "Лимитированные" && gift.rarity === "Limited")
        || (category === "До 100 ⭐" && gift.stars <= 100);
      return matchesQuery && matchesCategory;
    });
  }, [category, query]);

  const openWallet = () => {
    if (tonWallet) {
      toast.success("TON-кошелёк уже подключён", { description: formatTonAddress(tonWallet.account.address) });
      return;
    }
    tonConnectUI.openModal();
  };

  const openTopUp = (mode: "stars" | "ton") => {
    setTopUpMode(mode);
    if (mode === "ton") openWallet();
  };

  const payWithStars = async () => {
    try {
      const result = await createInvoice.mutateAsync({ stars: starsAmount, payload: `gift-house-topup-${Date.now()}` });
      const webApp = (window as Window & { Telegram?: { WebApp?: { openInvoice?: (url: string, callback?: (status: string) => void) => void } } }).Telegram?.WebApp;
      if (result.invoiceUrl) {
        if (webApp?.openInvoice) webApp.openInvoice(result.invoiceUrl, (status) => toast.info(`Статус оплаты: ${status}`));
        else window.open(result.invoiceUrl, "_blank", "noopener,noreferrer");
      }
      toast.success("Счёт Stars создан", { description: "Завершите оплату в Telegram." });
      setTopUpMode(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Добавьте TELEGRAM_BOT_TOKEN в секреты проекта";
      toast.error("Платёжный API ещё не активирован", { description: message });
    }
  };

  const renderHome = () => (
    <>
      <section className="hero-card">
        <div className="hero-noise" />
        <div className="hero-copy">
          <div className="eyebrow"><Sparkles size={13} /> TELEGRAM COLLECTIBLES</div>
          <h1>Редкие подарки.<br /><span>Своя коллекция.</span></h1>
          <p>Покупайте и продавайте настоящие collectible gifts Telegram в одном месте.</p>
          <button className="primary-button hero-button" onClick={() => changeTab("store")}>Открыть магазин <ArrowUpRight size={17} /></button>
        </div>
        <div className="hero-orbit hero-orbit-one" />
        <div className="hero-orbit hero-orbit-two" />
        <div className="hero-gift"><Gift size={72} strokeWidth={1.15} /><div className="hero-gift-star">✦</div></div>
      </section>

      <section className="balance-card">
        <div className="section-label"><span>ВАШ БАЛАНС</span><ShieldCheck size={14} /></div>
        <div className="balance-row"><div><div className="balance-value"><Star size={20} fill="currentColor" /> 1 250</div><div className="balance-secondary"><span className="ton-dot">◆</span> 0.42 TON</div></div><button className="ghost-icon-button" onClick={() => setActiveTab("profile")} aria-label="Профиль"><ChevronRight size={18} /></button></div>
        <div className="balance-actions"><button className="balance-action balance-action-primary" onClick={() => openTopUp("stars")}><Plus size={16} /> Пополнить Stars</button><button className="balance-action" onClick={() => openTopUp("ton")}><WalletCards size={16} /> {tonWallet ? "Кошелёк подключён" : "Подключить TON"}</button></div>
      </section>

      <section className="section-block">
        <div className="section-heading"><div><span className="eyebrow">CURATED DROP</span><h2>Популярные лоты</h2></div><button className="text-button" onClick={() => changeTab("store")}>Все лоты <ChevronRight size={15} /></button></div>
        <div className="featured-grid">{gifts.slice(0, 2).map((gift) => <button className="featured-card" key={gift.id} onClick={() => setSelectedGift(gift)}><GiftArtwork gift={gift} /><div className="featured-info"><strong>{gift.name}</strong><span>{gift.available} в каталоге</span><StarsMark amount={gift.stars} /></div><ArrowUpRight className="card-arrow" size={16} /></button>)}</div>
      </section>

      <section className="section-block collections-block">
        <div className="section-heading"><div><span className="eyebrow">EXPLORE</span><h2>Коллекции</h2></div><CircleHelp size={17} className="muted-icon" /></div>
        <div className="collection-row"><button onClick={() => { setCategory("Редкие"); changeTab("store"); }} className="collection-tile collection-tile-purple"><Gem size={23} /><span>Редкие</span><small>2 306 NFT</small></button><button onClick={() => { setCategory("Лимитированные"); changeTab("store"); }} className="collection-tile collection-tile-gold"><Crown size={23} /><span>Limited</span><small>736 NFT</small></button><button onClick={() => { setCategory("До 100 ⭐"); changeTab("store"); }} className="collection-tile collection-tile-blue"><Zap size={23} /><span>До 100 ⭐</span><small>4 908 NFT</small></button></div>
      </section>
    </>
  );

  const renderStore = () => (
    <>
      <div className="page-title-row"><div><span className="eyebrow">MARKETPLACE</span><h1>Магазин</h1><p>Коллекционные подарки Telegram</p></div><button className="round-button"><SlidersHorizontal size={18} /></button></div>
      <div className="search-row"><div className="search-field"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Поиск подарка" /></div><button className="filter-button"><SlidersHorizontal size={17} /></button></div>
      <div className="category-scroll">{categories.map((item) => <button key={item} className={category === item ? "category-pill active" : "category-pill"} onClick={() => setCategory(item)}>{item}</button>)}</div>
      <div className="catalog-meta"><span><span className="live-dot" /> Каталог обновляется из resale-лотов Telegram</span><span>{filteredGifts.length} лотов</span></div>
      <div className="gift-grid">{filteredGifts.map((gift) => <button key={gift.id} className="gift-card" onClick={() => setSelectedGift(gift)}><GiftArtwork gift={gift} /><div className="gift-card-content"><div className="gift-card-top"><strong>{gift.name}</strong><span className="rarity-chip">{gift.rarity}</span></div><small>{gift.collection}</small><div className="gift-card-bottom"><StarsMark amount={gift.stars} /><span className="ton-price">◆ {gift.ton} TON</span></div></div></button>)}</div>
      <div className="source-note"><BadgeCheck size={15} /><span>Названия основаны на реальных Telegram collectible gifts. Цены в Stars и TON — ориентиры до подключения live resale API.</span></div>
    </>
  );

  const renderMarket = () => (
    <>
      <div className="page-title-row"><div><span className="eyebrow">SECONDARY MARKET</span><h1>Маркет</h1><p>Продавайте и находите редкие лоты</p></div><button className="round-button"><Repeat2 size={18} /></button></div>
      <div className="market-hero"><div><span className="eyebrow">YOUR COLLECTION</span><h3>Выберите подарок,<br />чтобы выставить его</h3><button className="primary-button" onClick={() => toast.info("Подключение инвентаря Telegram будет доступно после настройки API")}>Выбрать подарок <ChevronRight size={16} /></button></div><div className="market-hero-icon"><ShoppingBag size={46} /></div></div>
      <div className="section-heading"><div><span className="eyebrow">TRENDING NOW</span><h2>Сейчас покупают</h2></div><button className="text-button" onClick={() => changeTab("store")}>Смотреть все <ChevronRight size={15} /></button></div>
      <div className="market-list">{gifts.slice(2, 6).map((gift, index) => <button key={gift.id} className="market-list-item" onClick={() => setSelectedGift(gift)}><span className="rank">0{index + 1}</span><GiftArtwork gift={gift} /><span className="market-list-name"><strong>{gift.name}</strong><small>{gift.available} лотов</small></span><span className="market-list-price"><StarsMark amount={gift.stars} compact /><small>рост +{index + 7}%</small></span><ChevronRight size={16} className="muted-icon" /></button>)}</div>
    </>
  );

  const renderProfile = () => (
    <>
      <div className="profile-head"><div className="profile-avatar">{telegramUser?.photo_url ? <img src={telegramUser.photo_url} alt={profileName} /> : <span>{profileInitials}</span>}</div><div><span className="eyebrow">TELEGRAM MEMBER</span><h1>{profileName} <span className="vip-badge">VIP</span></h1><p>{profileHandle}{telegramUser?.username ? ` · ID: ${telegramUser.id}` : ""}</p></div><button className="round-button" aria-label="Настройки профиля"><Menu size={18} /></button></div>
      <section className="profile-balance"><div className="section-label"><span>ДОСТУПНО</span><Star size={14} fill="currentColor" /></div><div className="profile-stars"><Star size={25} fill="currentColor" /> 1 250</div><div className="profile-ton">◆ 0.42 TON <span>≈ $2.95</span></div><button className="primary-button" onClick={() => openTopUp("stars")}><Plus size={16} /> Пополнить баланс</button></section>
      <div className="stats-row"><div><strong>48</strong><small>Подарков</small></div><div><strong>12</strong><small>Продаж</small></div><div><strong>36</strong><small>Покупок</small></div></div>
      <div className="profile-menu">{[
        { Icon: Gift, title: "Мои подарки", description: "48 collectible gifts" },
        { Icon: Repeat2, title: "История сделок", description: "Последняя покупка сегодня" },
        { Icon: WalletCards, title: "Кошельки", description: tonWallet ? formatTonAddress(tonWallet.account.address) : "TON Connect не подключён" },
        { Icon: CircleHelp, title: "Поддержка", description: "Ответим в Telegram" },
      ].map(({ Icon, title, description }) => <button key={title} className="profile-menu-item" onClick={() => title === "Кошельки" ? openWallet() : toast.info(`${title}: раздел готовится к подключению`)}><span className="menu-icon"><Icon size={18} /></span><span><strong>{title}</strong><small>{description}</small></span><ChevronRight size={17} className="muted-icon" /></button>)}</div>
      <div className="security-note"><ShieldCheck size={17} /><span>Платежи проходят через Telegram Stars и TON Connect. Мы не храним seed-фразы.</span></div>
    </>
  );

  return (
    <main className="app-shell">
      <header className="topbar"><div className="brand-mark"><div className="brand-symbol"><Gift size={17} /></div><span>Gift <b>House</b></span></div><div className="topbar-right"><span className="online-status"><span className="live-dot" /> LIVE</span><button className="topbar-help"><CircleHelp size={17} /></button></div></header>
      <div className="page-content">{activeTab === "home" && renderHome()}{activeTab === "store" && renderStore()}{activeTab === "market" && renderMarket()}{activeTab === "profile" && renderProfile()}</div>
      <nav className="bottom-nav" aria-label="Основная навигация">{navItems.map(({ id, label, Icon }) => <button key={id} className={activeTab === id ? "nav-item active" : "nav-item"} aria-current={activeTab === id ? "page" : undefined} onClick={() => changeTab(id)}><Icon size={19} /><span>{label}</span></button>)}</nav>

      {selectedGift && <div className="modal-backdrop" onClick={() => setSelectedGift(null)}><div className="gift-modal" onClick={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setSelectedGift(null)}><X size={18} /></button><GiftArtwork gift={selectedGift} large /><div className="modal-content"><div className="modal-kicker"><span className="rarity-chip">{selectedGift.rarity}</span><span><span className="live-dot" /> verified collection</span></div><h2>{selectedGift.name}</h2><p>{selectedGift.collection} · resale lot #{selectedGift.id.slice(0, 4).toUpperCase()}</p><div className="modal-price-row"><div><small>Цена в Telegram Stars</small><strong><StarsMark amount={selectedGift.stars} /></strong></div><div className="modal-ton"><small>Ориентир в TON</small><strong>◆ {selectedGift.ton} TON</strong></div></div><button className="primary-button full-button" onClick={() => { setSelectedGift(null); openTopUp("stars"); }}>Купить за {selectedGift.stars} ⭐ <ArrowUpRight size={17} /></button><div className="modal-footnote"><ShieldCheck size={14} /> NFT передаётся после подтверждения сделки</div></div></div></div>}
      {topUpMode === "stars" && <div className="modal-backdrop" onClick={() => setTopUpMode(null)}><div className="topup-modal" onClick={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setTopUpMode(null)}><X size={18} /></button><div className="topup-icon"><Star size={28} fill="currentColor" /></div><span className="eyebrow">TELEGRAM PAYMENTS API</span><h2>Пополнить Stars</h2><p>Счёт откроется прямо в Telegram. Валюта платежа — XTR.</p><div className="amount-grid">{[75, 100, 150, 500].map((amount) => <button key={amount} className={starsAmount === amount ? "amount-chip active" : "amount-chip"} onClick={() => setStarsAmount(amount)}><Star size={13} fill="currentColor" /> {amount}</button>)}</div><label className="amount-label">Сумма Stars<input type="number" min={1} max={100000} value={starsAmount} onChange={(event) => setStarsAmount(Number(event.target.value))} /></label><button className="primary-button full-button" disabled={createInvoice.isPending} onClick={payWithStars}>{createInvoice.isPending ? "Создаём счёт…" : `Оплатить ${starsAmount} ⭐`} <ArrowUpRight size={17} /></button><div className="modal-footnote"><ShieldCheck size={14} /> Telegram обрабатывает платёж, данные карты не передаются нам</div></div></div>}
    </main>
  );
}
