import { useEffect, useMemo, useState } from 'react'
import {
  BadgeDollarSign,
  Boxes,
  Check,
  Copy,
  FileText,
  GitBranch,
  Image,
  KeyRound,
  LayoutTemplate,
  Mail,
  Moon,
  PackagePlus,
  Plus,
  ReceiptText,
  Search,
  ShieldCheck,
  Sparkles,
  StickyNote,
  Sun,
  Wrench,
  Trash2,
  UserRound,
} from 'lucide-react'
import { supabase, supabaseConfigured } from './lib/supabase'
import './App.css'

type Theme = 'light' | 'dark'
type View = 'templates' | 'products' | 'accounts' | 'notes' | 'sales' | 'troubleshooting'

type Variation = {
  id: string
  name: string
  price: number
}

type EmailTemplate = {
  id: string
  subject: string
  content: string
}

type Product = {
  id: string
  name: string
  description: string
  price: number
  image: string
  variations: Variation[]
  emailTemplates: EmailTemplate[]
}

type InventoryEntry = {
  id: string
  primary: string
  secondary: string
  createdAt: string
}

type Note = {
  id: string
  title: string
  body: string
}

type Sale = {
  id: string
  item: string
  amount: number
  status: 'Paid' | 'Pending'
}

type TroubleshootingItem = {
  id: string
  errorName: string
  errorImage: string
  fix: string
  fixImage: string
}

const peso = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  maximumFractionDigits: 0,
})

const today = new Intl.DateTimeFormat('en-PH', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

const seedProducts: Product[] = [
  {
    id: crypto.randomUUID(),
    name: 'Microsoft 365 Family',
    description: 'Shared 365 access with onboarding template and instant delivery notes.',
    price: 499,
    image:
      'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=80',
    variations: [
      { id: crypto.randomUUID(), name: '1 Month', price: 149 },
      { id: crypto.randomUUID(), name: '1 Year', price: 499 },
    ],
    emailTemplates: [
      {
        id: crypto.randomUUID(),
        subject: 'Your Microsoft 365 account is ready',
        content:
          'Hi! Your Microsoft 365 account is now active. Sign in using the credentials below and change your recovery details after first login.',
      },
      {
        id: crypto.randomUUID(),
        subject: 'Microsoft 365 renewal reminder',
        content:
          'Your subscription is nearing its renewal date. Reply here if you want us to reserve the same slot for another cycle.',
      },
    ],
  },
  {
    id: crypto.randomUUID(),
    name: 'Windows 11 Pro Key',
    description: 'Retail-style activation key with quick installation guidance.',
    price: 299,
    image:
      'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80',
    variations: [{ id: crypto.randomUUID(), name: 'Single device', price: 299 }],
    emailTemplates: [
      {
        id: crypto.randomUUID(),
        subject: 'Your Windows activation key',
        content:
          'Thank you for your purchase. Open Settings, go to Activation, then enter the key below. Message us if activation needs assistance.',
      },
    ],
  },
]

const seedNotes: Note[] = [
  {
    id: crypto.randomUUID(),
    title: 'Fulfillment checklist',
    body: 'Confirm payment, reserve inventory, send template, then mark the sale as paid.',
  },
]

const seedSales: Sale[] = [
  { id: crypto.randomUUID(), item: 'Microsoft 365 Family', amount: 499, status: 'Paid' },
  { id: crypto.randomUUID(), item: 'Windows 11 Pro Key', amount: 299, status: 'Pending' },
]

const seedTroubleshooting: TroubleshootingItem[] = [
  {
    id: crypto.randomUUID(),
    errorName: 'Activation limit reached',
    errorImage: '',
    fix: 'Ask the buyer to retry activation after disconnecting old devices, then provide a replacement key if the error persists.',
    fixImage: '',
  },
]

const navItems: Array<{ id: View; label: string; icon: typeof LayoutTemplate }> = [
  { id: 'templates', label: 'Templates', icon: LayoutTemplate },
  { id: 'products', label: 'Products', icon: Boxes },
  { id: 'accounts', label: 'Accounts & Keys', icon: KeyRound },
  { id: 'notes', label: 'Notes', icon: StickyNote },
  { id: 'sales', label: 'Sales', icon: BadgeDollarSign },
  { id: 'troubleshooting', label: 'Troubleshooting', icon: Wrench },
]

function App() {
  const [theme, setTheme] = useState<Theme>(() =>
    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
  )
  const [view, setView] = useState<View>('products')
  const [products, setProducts] = useState<Product[]>(seedProducts)
  const [accounts365, setAccounts365] = useState<InventoryEntry[]>([
    makeEntry('test1 test2'),
    makeEntry('admin@shoply.ph demo-pass-2026'),
  ])
  const [windowsKeys, setWindowsKeys] = useState<InventoryEntry[]>([
    makeEntry('huawdiuy21312312 21h3u2'),
    makeEntry('WIN11-PRO-9X21 Q4-batch'),
  ])
  const [notes, setNotes] = useState<Note[]>(seedNotes)
  const [sales, setSales] = useState<Sale[]>(seedSales)
  const [troubleshooting, setTroubleshooting] =
    useState<TroubleshootingItem[]>(seedTroubleshooting)
  const [query, setQuery] = useState('')
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [authMessage, setAuthMessage] = useState('Supabase is ready for your project keys.')

  const templates = useMemo(
    () =>
      products.flatMap((product) =>
        product.emailTemplates.map((template) => ({
          ...template,
          productName: product.name,
        })),
      ),
    [products],
  )

  const filteredProducts = useMemo(
    () =>
      products.filter((product) =>
        `${product.name} ${product.description}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [products, query],
  )

  const stats = useMemo(
    () => [
      { label: 'Products', value: products.length.toString(), icon: Boxes },
      { label: 'Templates', value: templates.length.toString(), icon: Mail },
      { label: '365 accounts', value: accounts365.length.toString(), icon: UserRound },
      { label: 'Revenue', value: peso.format(sales.reduce((sum, sale) => sum + sale.amount, 0)), icon: ReceiptText },
    ],
    [accounts365.length, products.length, sales, templates.length],
  )

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  async function handleAuth(mode: 'signIn' | 'signUp') {
    if (!supabaseConfigured) {
      setAuthMessage('Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local first.')
      return
    }

    const method = mode === 'signIn' ? supabase.auth.signInWithPassword : supabase.auth.signUp
    const { error } = await method({ email: authEmail, password: authPassword })
    setAuthMessage(error ? error.message : mode === 'signIn' ? 'Signed in successfully.' : 'Check your email to confirm the account.')
  }

  function addProduct(formData: FormData) {
    const product: Product = {
      id: crypto.randomUUID(),
      name: String(formData.get('name') || 'Untitled product'),
      description: String(formData.get('description') || 'No description added.'),
      price: Number(formData.get('price') || 0),
      image: String(formData.get('image') || 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=900&q=80'),
      variations: parseLines(String(formData.get('variations') || '')).map((line) => {
        const [name, price = '0'] = line.split('|').map((part) => part.trim())
        return { id: crypto.randomUUID(), name, price: Number(price) || 0 }
      }),
      emailTemplates: parseLines(String(formData.get('templates') || '')).map((line) => {
        const [subject, content = ''] = line.split('|').map((part) => part.trim())
        return { id: crypto.randomUUID(), subject, content }
      }),
    }

    setProducts((current) => [product, ...current])
  }

  function addEntry(value: string, type: '365' | 'windows') {
    const parsed = makeEntry(value)
    if (!parsed.primary) return
    if (type === '365') setAccounts365((current) => [parsed, ...current])
    if (type === 'windows') setWindowsKeys((current) => [parsed, ...current])
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <Sparkles size={20} />
          </div>
          <div>
            <strong>Shoply</strong>
            <span>Digital inventory suite</span>
          </div>
        </div>

        <nav className="nav-list" aria-label="Primary">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                className={view === item.id ? 'active' : ''}
                key={item.id}
                onClick={() => setView(item.id)}
                type="button"
              >
                <Icon size={18} />
                {item.label}
              </button>
            )
          })}
        </nav>

        <div className="auth-panel">
          <div className="section-kicker">
            <ShieldCheck size={15} />
            Supabase Auth
          </div>
          <input value={authEmail} onChange={(event) => setAuthEmail(event.target.value)} placeholder="email@shoply.ph" type="email" />
          <input value={authPassword} onChange={(event) => setAuthPassword(event.target.value)} placeholder="Password" type="password" />
          <div className="button-row">
            <button onClick={() => handleAuth('signIn')} type="button">Sign in</button>
            <button onClick={() => handleAuth('signUp')} type="button">Sign up</button>
          </div>
          <p>{authMessage}</p>
        </div>

        <a className="github-link" href="https://github.com/desamparado13/shoply" target="_blank">
          <GitBranch size={16} />
          desamparado13/shoply
        </a>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <div>
            <span className="eyebrow">Premium control desk</span>
            <h1>{titleFor(view)}</h1>
          </div>
          <div className="topbar-actions">
            <label className="search-box">
              <Search size={17} />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search inventory" />
            </label>
            <button className="icon-button" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} type="button" aria-label="Toggle theme">
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
          </div>
        </header>

        <section className="stats-grid">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <article className="stat-card" key={stat.label}>
                <Icon size={18} />
                <span>{stat.label}</span>
                <strong>{stat.value}</strong>
              </article>
            )
          })}
        </section>

        {view === 'products' && (
          <ProductsView products={filteredProducts} onAddProduct={addProduct} onDeleteProduct={(id) => setProducts((current) => current.filter((product) => product.id !== id))} />
        )}
        {view === 'accounts' && (
          <AccountsView
            accounts365={accounts365}
            windowsKeys={windowsKeys}
            onAdd={addEntry}
            onDelete365={(id) => setAccounts365((current) => current.filter((entry) => entry.id !== id))}
            onDeleteWindows={(id) => setWindowsKeys((current) => current.filter((entry) => entry.id !== id))}
          />
        )}
        {view === 'templates' && <TemplatesView templates={templates} />}
        {view === 'notes' && <NotesView notes={notes} onAdd={(note) => setNotes((current) => [note, ...current])} />}
        {view === 'sales' && <SalesView sales={sales} onAdd={(sale) => setSales((current) => [sale, ...current])} />}
        {view === 'troubleshooting' && (
          <TroubleshootingView
            items={troubleshooting}
            onAdd={(item) => setTroubleshooting((current) => [item, ...current])}
          />
        )}
      </main>
    </div>
  )
}

function ProductsView({
  products,
  onAddProduct,
  onDeleteProduct,
}: {
  products: Product[]
  onAddProduct: (formData: FormData) => void
  onDeleteProduct: (id: string) => void
}) {
  return (
    <section className="content-grid products-layout">
      <form
        className="command-panel"
        onSubmit={(event) => {
          event.preventDefault()
          onAddProduct(new FormData(event.currentTarget))
          event.currentTarget.reset()
        }}
      >
        <div className="panel-heading">
          <PackagePlus size={19} />
          <div>
            <h2>Add product</h2>
            <p>Product, variations, prices, image URL, and multiple email templates.</p>
          </div>
        </div>
        <input name="name" placeholder="Product name" required />
        <textarea name="description" placeholder="Product description" rows={3} required />
        <input name="price" placeholder="Base price in PHP" type="number" min="0" required />
        <input name="image" placeholder="Image URL" />
        <textarea name="variations" placeholder="Variation | Price, one per line" rows={4} />
        <textarea name="templates" placeholder="Subject | Content, one email template per line" rows={5} />
        <button className="primary-button" type="submit">
          <Plus size={17} />
          Add product
        </button>
      </form>

      <div className="product-grid">
        {products.map((product) => (
          <article className="product-card" key={product.id}>
            <img src={product.image} alt="" />
            <div className="product-body">
              <div className="product-title">
                <div>
                  <h3>{product.name}</h3>
                  <p>{product.description}</p>
                </div>
                <strong>{peso.format(product.price)}</strong>
              </div>
              <div className="chip-row">
                {product.variations.map((variation) => (
                  <span className="chip" key={variation.id}>{variation.name} · {peso.format(variation.price)}</span>
                ))}
              </div>
              <div className="template-stack">
                {product.emailTemplates.map((template) => (
                  <div className="mini-template" key={template.id}>
                    <Mail size={15} />
                    <span>{template.subject}</span>
                  </div>
                ))}
              </div>
              <div className="copy-actions">
                <button
                  className="ghost-button"
                  type="button"
                  onClick={() =>
                    navigator.clipboard.writeText(product.emailTemplates[0]?.subject ?? '')
                  }
                >
                  <Copy size={15} />
                  Copy subject
                </button>
                <button
                  className="ghost-button"
                  type="button"
                  onClick={() =>
                    navigator.clipboard.writeText(product.emailTemplates[0]?.content ?? '')
                  }
                >
                  <Copy size={15} />
                  Copy content
                </button>
              </div>
              <button className="ghost-button danger" type="button" onClick={() => onDeleteProduct(product.id)}>
                <Trash2 size={16} />
                Delete
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function AccountsView({
  accounts365,
  windowsKeys,
  onAdd,
  onDelete365,
  onDeleteWindows,
}: {
  accounts365: InventoryEntry[]
  windowsKeys: InventoryEntry[]
  onAdd: (value: string, type: '365' | 'windows') => void
  onDelete365: (id: string) => void
  onDeleteWindows: (id: string) => void
}) {
  return (
    <section className="split-panels">
      <InventoryBucket
        title="365 accounts"
        description="Paste entries like: test1 test2"
        entries={accounts365}
        onAdd={(value) => onAdd(value, '365')}
        onDelete={onDelete365}
      />
      <InventoryBucket
        title="Windows keys"
        description="Paste entries like: huawdiuy21312312 21h3u2"
        entries={windowsKeys}
        onAdd={(value) => onAdd(value, 'windows')}
        onDelete={onDeleteWindows}
      />
    </section>
  )
}

function InventoryBucket({
  title,
  description,
  entries,
  onAdd,
  onDelete,
}: {
  title: string
  description: string
  entries: InventoryEntry[]
  onAdd: (value: string) => void
  onDelete: (id: string) => void
}) {
  const [value, setValue] = useState('')

  return (
    <article className="command-panel">
      <div className="panel-heading">
        <KeyRound size={19} />
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      </div>
      <form
        className="inline-form"
        onSubmit={(event) => {
          event.preventDefault()
          onAdd(value)
          setValue('')
        }}
      >
        <input value={value} onChange={(event) => setValue(event.target.value)} placeholder="primary secondary" />
        <button className="icon-button" type="submit" aria-label={`Add ${title}`}>
          <Plus size={18} />
        </button>
      </form>
      <div className="entry-list">
        {entries.map((entry) => (
          <div className="entry-row" key={entry.id}>
            <div>
              <strong>{entry.primary}</strong>
              <span>{entry.secondary || 'No secondary value'} · {today.format(new Date(entry.createdAt))}</span>
            </div>
            <button className="icon-button" type="button" onClick={() => navigator.clipboard.writeText(`${entry.primary} ${entry.secondary}`)} aria-label="Copy entry">
              <Copy size={16} />
            </button>
            <button className="icon-button danger" type="button" onClick={() => onDelete(entry.id)} aria-label="Delete entry">
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
    </article>
  )
}

function TemplatesView({ templates }: { templates: Array<EmailTemplate & { productName: string }> }) {
  return (
    <section className="template-grid">
      {templates.map((template) => (
        <article className="template-card" key={template.id}>
          <div className="template-icon">
            <FileText size={20} />
          </div>
          <span>{template.productName}</span>
          <h3>{template.subject}</h3>
          <p>{template.content}</p>
        </article>
      ))}
    </section>
  )
}

function NotesView({ notes, onAdd }: { notes: Note[]; onAdd: (note: Note) => void }) {
  return (
    <section className="split-panels">
      <form
        className="command-panel"
        onSubmit={(event) => {
          event.preventDefault()
          const data = new FormData(event.currentTarget)
          onAdd({
            id: crypto.randomUUID(),
            title: String(data.get('title') || 'Untitled note'),
            body: String(data.get('body') || ''),
          })
          event.currentTarget.reset()
        }}
      >
        <div className="panel-heading">
          <StickyNote size={19} />
          <div>
            <h2>Add note</h2>
            <p>Keep operational reminders beside inventory.</p>
          </div>
        </div>
        <input name="title" placeholder="Note title" required />
        <textarea name="body" placeholder="Note body" rows={6} required />
        <button className="primary-button" type="submit">
          <Plus size={17} />
          Add note
        </button>
      </form>
      <div className="note-list">
        {notes.map((note) => (
          <article className="note-card" key={note.id}>
            <h3>{note.title}</h3>
            <p>{note.body}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

function SalesView({ sales, onAdd }: { sales: Sale[]; onAdd: (sale: Sale) => void }) {
  return (
    <section className="split-panels">
      <form
        className="command-panel"
        onSubmit={(event) => {
          event.preventDefault()
          const data = new FormData(event.currentTarget)
          onAdd({
            id: crypto.randomUUID(),
            item: String(data.get('item') || 'Sale'),
            amount: Number(data.get('amount') || 0),
            status: String(data.get('status')) === 'Paid' ? 'Paid' : 'Pending',
          })
          event.currentTarget.reset()
        }}
      >
        <div className="panel-heading">
          <BadgeDollarSign size={19} />
          <div>
            <h2>Add sale</h2>
            <p>Track product movement and revenue.</p>
          </div>
        </div>
        <input name="item" placeholder="Product or service" required />
        <input name="amount" placeholder="Amount in PHP" type="number" min="0" required />
        <select name="status" defaultValue="Paid">
          <option>Paid</option>
          <option>Pending</option>
        </select>
        <button className="primary-button" type="submit">
          <Plus size={17} />
          Add sale
        </button>
      </form>
      <div className="sales-table">
        {sales.map((sale) => (
          <div className="sale-row" key={sale.id}>
            <div>
              <strong>{sale.item}</strong>
              <span>{peso.format(sale.amount)}</span>
            </div>
            <span className={sale.status === 'Paid' ? 'status paid' : 'status pending'}>
              <Check size={14} />
              {sale.status}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}

function TroubleshootingView({
  items,
  onAdd,
}: {
  items: TroubleshootingItem[]
  onAdd: (item: TroubleshootingItem) => void
}) {
  return (
    <section className="split-panels">
      <form
        className="command-panel"
        onSubmit={(event) => {
          event.preventDefault()
          const data = new FormData(event.currentTarget)
          onAdd({
            id: crypto.randomUUID(),
            errorName: String(data.get('errorName') || 'Untitled error'),
            errorImage: String(data.get('errorImage') || ''),
            fix: String(data.get('fix') || ''),
            fixImage: String(data.get('fixImage') || ''),
          })
          event.currentTarget.reset()
        }}
      >
        <div className="panel-heading">
          <Wrench size={19} />
          <div>
            <h2>Add troubleshooting</h2>
            <p>Error name, optional screenshots, and the exact fix.</p>
          </div>
        </div>
        <input name="errorName" placeholder="Error name" required />
        <input name="errorImage" placeholder="Error image URL (optional)" />
        <textarea name="fix" placeholder="Fix" rows={6} required />
        <input name="fixImage" placeholder="Fix image URL (optional)" />
        <button className="primary-button" type="submit">
          <Plus size={17} />
          Add fix
        </button>
      </form>
      <div className="troubleshooting-list">
        {items.map((item) => (
          <article className="troubleshooting-card" key={item.id}>
            <div className="panel-heading">
              <Wrench size={18} />
              <div>
                <h3>{item.errorName}</h3>
                <p>Known issue and fix</p>
              </div>
            </div>
            {item.errorImage && (
              <figure>
                <img src={item.errorImage} alt="" />
                <figcaption>
                  <Image size={14} />
                  Error image
                </figcaption>
              </figure>
            )}
            <div className="fix-block">
              <strong>Fix</strong>
              <p>{item.fix}</p>
            </div>
            {item.fixImage && (
              <figure>
                <img src={item.fixImage} alt="" />
                <figcaption>
                  <Image size={14} />
                  Fix image
                </figcaption>
              </figure>
            )}
          </article>
        ))}
      </div>
    </section>
  )
}

function makeEntry(value: string): InventoryEntry {
  const [primary = '', ...rest] = value.trim().split(/\s+/)
  return {
    id: crypto.randomUUID(),
    primary,
    secondary: rest.join(' '),
    createdAt: new Date().toISOString(),
  }
}

function parseLines(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
}

function titleFor(view: View) {
  const titles: Record<View, string> = {
    templates: 'Templates',
    products: 'Inventory - Products',
    accounts: 'Inventory - Accounts & Keys',
    notes: 'Notes',
    sales: 'Sales',
    troubleshooting: 'Troubleshooting',
  }
  return titles[view]
}

export default App
