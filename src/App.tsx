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
  Video,
  Wrench,
  Trash2,
  UserRound,
} from 'lucide-react'
import type { Session } from '@supabase/supabase-js'
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
  productId: string
  productName: string
  subject: string
  content: string
}

type ProductMedia = {
  id: string
  type: 'video'
  url: string
}

type Product = {
  id: string
  name: string
  description: string
  price: number
  image: string
  media: ProductMedia[]
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

type ProductRow = {
  id: string
  name: string
  description: string
  price_php: number
  image_url: string | null
  product_variations?: Array<{
    id: string
    name: string
    price_php: number
  }>
  product_media?: Array<{
    id: string
    media_type: 'video'
    url: string
  }>
}

type CredentialRow = {
  id: string
  kind: 'microsoft_365' | 'windows_key'
  primary_value: string
  secondary_value: string | null
  created_at: string
}

type NoteRow = {
  id: string
  title: string
  body: string
}

type EmailTemplateRow = {
  id: string
  product_id: string | null
  subject: string
  content: string
  products?:
    | {
    name: string
      }
    | Array<{
        name: string
      }>
    | null
}

type SaleRow = {
  id: string
  item: string
  amount_php: number
  status: 'Paid' | 'Pending'
}

type TroubleshootingRow = {
  id: string
  error_name: string
  error_image_url: string | null
  fix: string
  fix_image_url: string | null
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
  const [session, setSession] = useState<Session | null>(null)
  const [loadingData, setLoadingData] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([])
  const [accounts365, setAccounts365] = useState<InventoryEntry[]>([])
  const [windowsKeys, setWindowsKeys] = useState<InventoryEntry[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [troubleshooting, setTroubleshooting] = useState<TroubleshootingItem[]>([])
  const [query, setQuery] = useState('')
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [authMessage, setAuthMessage] = useState('Sign in to load and save Shoply data.')
  const [authLoading, setAuthLoading] = useState(false)

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
      { label: 'Templates', value: emailTemplates.length.toString(), icon: Mail },
      { label: '365 accounts', value: accounts365.length.toString(), icon: UserRound },
      { label: 'Revenue', value: peso.format(sales.reduce((sum, sale) => sum + sale.amount, 0)), icon: ReceiptText },
    ],
    [accounts365.length, emailTemplates.length, products.length, sales],
  )

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  useEffect(() => {
    if (!supabaseConfigured) return

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      if (data.session) {
        setAuthMessage(`Signed in as ${data.session.user.email ?? 'Shoply user'}.`)
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      if (!nextSession) {
        setProducts([])
        setEmailTemplates([])
        setAccounts365([])
        setWindowsKeys([])
        setNotes([])
        setSales([])
        setTroubleshooting([])
        setAuthMessage('Sign in to load and save Shoply data.')
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session) return
    loadShoplyData(session.user.id)
    // loadShoplyData is intentionally invoked only when the active Supabase session changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session])

  async function handleAuth(mode: 'signIn' | 'signUp') {
    if (!supabaseConfigured) {
      setAuthMessage('Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local first.')
      return
    }

    if (!authEmail || !authPassword) {
      setAuthMessage('Enter an email and password first.')
      return
    }

    setAuthLoading(true)
    setAuthMessage(mode === 'signIn' ? 'Signing in...' : 'Creating account...')

    try {
      const { error } =
        mode === 'signIn'
          ? await supabase.auth.signInWithPassword({
              email: authEmail,
              password: authPassword,
            })
          : await supabase.auth.signUp({
              email: authEmail,
              password: authPassword,
            })

      setAuthMessage(
        error
          ? error.message
          : mode === 'signIn'
            ? 'Signed in successfully.'
            : 'Check your email to confirm the account, then sign in.',
      )
    } catch (error) {
      setAuthMessage(error instanceof Error ? error.message : 'Supabase Auth failed.')
    } finally {
      setAuthLoading(false)
    }
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  async function loadShoplyData(userId: string) {
    setLoadingData(true)

    const [
      productsResult,
      templatesResult,
      credentialsResult,
      notesResult,
      salesResult,
      troubleshootingResult,
    ] = await Promise.all([
      supabase
        .from('products')
        .select('id,name,description,price_php,image_url,product_variations(id,name,price_php),product_media(id,media_type,url)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),
      supabase
        .from('email_templates')
        .select('id,product_id,subject,content,products(name)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),
      supabase
        .from('inventory_credentials')
        .select('id,kind,primary_value,secondary_value,created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),
      supabase.from('notes').select('id,title,body').eq('user_id', userId).order('created_at', { ascending: false }),
      supabase.from('sales').select('id,item,amount_php,status').eq('user_id', userId).order('created_at', { ascending: false }),
      supabase
        .from('troubleshooting')
        .select('id,error_name,error_image_url,fix,fix_image_url')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),
    ])

    const firstError =
      productsResult.error ??
      templatesResult.error ??
      credentialsResult.error ??
      notesResult.error ??
      salesResult.error ??
      troubleshootingResult.error

    if (firstError) {
      setAuthMessage(firstError.message)
      setLoadingData(false)
      return
    }

    const productRows = (productsResult.data ?? []) as ProductRow[]
    const templateRows = (templatesResult.data ?? []) as EmailTemplateRow[]
    const credentialRows = (credentialsResult.data ?? []) as CredentialRow[]
    const noteRows = (notesResult.data ?? []) as NoteRow[]
    const saleRows = (salesResult.data ?? []) as SaleRow[]
    const troubleshootingRows = (troubleshootingResult.data ?? []) as TroubleshootingRow[]

    const mappedTemplates = templateRows.map(mapEmailTemplateRow)
    setEmailTemplates(mappedTemplates)
    setProducts(
      productRows.map((product) =>
        mapProductRow(
          product,
          mappedTemplates.filter((template) => template.productId === product.id),
        ),
      ),
    )
    setAccounts365(
      credentialRows
        .filter((entry) => entry.kind === 'microsoft_365')
        .map(mapCredentialRow),
    )
    setWindowsKeys(
      credentialRows
        .filter((entry) => entry.kind === 'windows_key')
        .map(mapCredentialRow),
    )
    setNotes(noteRows.map((note) => ({ id: note.id, title: note.title, body: note.body })))
    setSales(
      saleRows.map((sale) => ({
        id: sale.id,
        item: sale.item,
        amount: Number(sale.amount_php),
        status: sale.status,
      })),
    )
    setTroubleshooting(troubleshootingRows.map(mapTroubleshootingRow))
    setAuthMessage(`Saved data loaded for ${session?.user.email ?? 'your account'}.`)
    setLoadingData(false)
  }

  async function addProduct(formData: FormData) {
    if (!session) {
      setAuthMessage('Sign in before adding products.')
      return
    }

    const coverImage = formData.get('coverImage')
    const extraImages = formData
      .getAll('productImages')
      .filter((value): value is File => value instanceof File && value.size > 0)
    const coverImageUrl =
      coverImage instanceof File && coverImage.size > 0
        ? await uploadProductImage(coverImage, session.user.id)
        : ''
    const extraImageUrls = await Promise.all(
      extraImages.map((file) => uploadProductImage(file, session.user.id)),
    )

    const productInput = {
      name: String(formData.get('name') || 'Untitled product'),
      description: String(formData.get('description') || 'No description added.'),
      price_php: Number(formData.get('price') || 0),
      image_url: coverImageUrl || extraImageUrls[0] || '',
      user_id: session.user.id,
    }
    const variationNames = formData.getAll('variationName').map((value) => String(value).trim())
    const variationPrices = formData.getAll('variationPrice').map((value) => Number(value) || 0)
    const variations = variationNames
      .map((name, index) => ({
        name,
        price_php: variationPrices[index] ?? 0,
      }))
      .filter((variation) => variation.name)
    const mediaLinks: Array<{ media_type: 'video'; url: string }> = [
      ...formData
        .getAll('videoLink')
        .map((value) => String(value).trim())
        .filter(Boolean)
        .map((url) => ({ media_type: 'video' as const, url })),
    ]

    const { data: product, error } = await supabase
      .from('products')
      .insert(productInput)
      .select('id')
      .single()

    if (error) {
      setAuthMessage(error.message)
      return
    }

    const productId = product.id as string

    const childInserts = []
    if (variations.length) {
      childInserts.push(
        supabase
          .from('product_variations')
          .insert(variations.map((variation) => ({ ...variation, product_id: productId }))),
      )
    }
    if (mediaLinks.length) {
      childInserts.push(
        supabase
          .from('product_media')
          .insert(mediaLinks.map((media) => ({ ...media, product_id: productId }))),
      )
    }

    const childResults = await Promise.all(childInserts)
    const childError = childResults.find((result) => result.error)?.error
    if (childError) {
      setAuthMessage(childError.message)
      return
    }

    await loadShoplyData(session.user.id)
  }

  async function deleteProduct(id: string) {
    if (!session) return
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (error) {
      setAuthMessage(error.message)
      return
    }
    await loadShoplyData(session.user.id)
  }

  async function addEntry(value: string, type: '365' | 'windows') {
    if (!session) {
      setAuthMessage('Sign in before adding inventory.')
      return
    }
    const parsed = makeEntry(value)
    if (!parsed.primary) return
    const { error } = await supabase.from('inventory_credentials').insert({
      user_id: session.user.id,
      kind: type === '365' ? 'microsoft_365' : 'windows_key',
      primary_value: parsed.primary,
      secondary_value: parsed.secondary,
    })
    if (error) {
      setAuthMessage(error.message)
      return
    }
    await loadShoplyData(session.user.id)
  }

  async function deleteEntry(id: string) {
    if (!session) return
    const { error } = await supabase.from('inventory_credentials').delete().eq('id', id)
    if (error) {
      setAuthMessage(error.message)
      return
    }
    await loadShoplyData(session.user.id)
  }

  async function addNote(note: Note) {
    if (!session) {
      setAuthMessage('Sign in before adding notes.')
      return
    }
    const { error } = await supabase.from('notes').insert({
      user_id: session.user.id,
      title: note.title,
      body: note.body,
    })
    if (error) {
      setAuthMessage(error.message)
      return
    }
    await loadShoplyData(session.user.id)
  }

  async function addEmailTemplate(template: {
    productId: string
    subject: string
    content: string
  }) {
    if (!session) {
      setAuthMessage('Sign in before adding email templates.')
      return
    }

    const { error } = await supabase.from('email_templates').insert({
      user_id: session.user.id,
      product_id: template.productId || null,
      subject: template.subject,
      content: template.content,
    })

    if (error) {
      setAuthMessage(error.message)
      return
    }

    await loadShoplyData(session.user.id)
  }

  async function addSale(sale: Sale) {
    if (!session) {
      setAuthMessage('Sign in before adding sales.')
      return
    }
    const { error } = await supabase.from('sales').insert({
      user_id: session.user.id,
      item: sale.item,
      amount_php: sale.amount,
      status: sale.status,
    })
    if (error) {
      setAuthMessage(error.message)
      return
    }
    await loadShoplyData(session.user.id)
  }

  async function addTroubleshooting(item: TroubleshootingItem) {
    if (!session) {
      setAuthMessage('Sign in before adding troubleshooting fixes.')
      return
    }
    const { error } = await supabase.from('troubleshooting').insert({
      user_id: session.user.id,
      error_name: item.errorName,
      error_image_url: item.errorImage || null,
      fix: item.fix,
      fix_image_url: item.fixImage || null,
    })
    if (error) {
      setAuthMessage(error.message)
      return
    }
    await loadShoplyData(session.user.id)
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
          {session ? (
            <div className="connected-pill">
              <div className="connected-dot">
                <ShieldCheck size={16} />
              </div>
              <div>
                <strong>Connected</strong>
                <span>{session.user.email}</span>
              </div>
              <button onClick={signOut} type="button" aria-label="Sign out">
                Sign out
              </button>
            </div>
          ) : (
            <>
              <div className="section-kicker">
                <ShieldCheck size={15} />
                Supabase Auth
              </div>
              <input value={authEmail} onChange={(event) => setAuthEmail(event.target.value)} placeholder="email@shoply.ph" type="email" />
              <input value={authPassword} onChange={(event) => setAuthPassword(event.target.value)} placeholder="Password" type="password" />
              <div className="button-row">
                <button disabled={authLoading} onClick={() => handleAuth('signIn')} type="button">Sign in</button>
                <button disabled={authLoading} onClick={() => handleAuth('signUp')} type="button">Sign up</button>
              </div>
              <p>{authMessage}</p>
            </>
          )}
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

        {loadingData && <div className="sync-banner">Loading Shoply database...</div>}
        {!session && (
          <div className="sync-banner">
            Sign in with Supabase Auth to load and save all Shoply data.
          </div>
        )}

        {view === 'products' && (
          <ProductsView products={filteredProducts} onAddProduct={addProduct} onDeleteProduct={deleteProduct} />
        )}
        {view === 'accounts' && (
          <AccountsView
            accounts365={accounts365}
            windowsKeys={windowsKeys}
            onAdd={addEntry}
            onDelete365={deleteEntry}
            onDeleteWindows={deleteEntry}
          />
        )}
        {view === 'templates' && (
          <TemplatesView
            products={products}
            templates={emailTemplates}
            onAdd={addEmailTemplate}
          />
        )}
        {view === 'notes' && <NotesView notes={notes} onAdd={addNote} />}
        {view === 'sales' && <SalesView sales={sales} onAdd={addSale} />}
        {view === 'troubleshooting' && (
          <TroubleshootingView
            items={troubleshooting}
            onAdd={addTroubleshooting}
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
  const [variationRows, setVariationRows] = useState<string[]>([])
  const [videoRows, setVideoRows] = useState<string[]>([])

  function addVariationRow() {
    setVariationRows((current) => [...current, crypto.randomUUID()])
  }

  function removeVariationRow(id: string) {
    setVariationRows((current) => current.filter((rowId) => rowId !== id))
  }

  function addVideoRow() {
    setVideoRows((current) => [...current, crypto.randomUUID()])
  }

  function removeVideoRow(id: string) {
    setVideoRows((current) => current.filter((rowId) => rowId !== id))
  }

  return (
    <section className="content-grid products-layout">
      <form
        className="command-panel"
        onSubmit={(event) => {
          event.preventDefault()
          onAddProduct(new FormData(event.currentTarget))
          event.currentTarget.reset()
          setVariationRows([])
          setVideoRows([])
        }}
      >
        <div className="panel-heading">
          <PackagePlus size={19} />
          <div>
            <h2>Add product</h2>
            <p>Product details, media links, variations, and pricing.</p>
          </div>
        </div>
        <input name="name" placeholder="Product name" required />
        <textarea name="description" placeholder="Product description" rows={3} required />
        <input name="price" placeholder="Base price in PHP" type="number" min="0" required />
        <label className="file-field">
          <span>Cover image</span>
          <input name="coverImage" type="file" accept="image/*" />
        </label>
        <label className="file-field">
          <span>More product images</span>
          <input name="productImages" type="file" accept="image/*" multiple />
        </label>
        <div className="optional-builder">
          <div className="optional-builder-heading">
            <div>
              <strong>Video links</strong>
              <span>Optional. Add external video links instead of uploading large video files.</span>
            </div>
            <div className="builder-actions">
              <button className="ghost-button" type="button" onClick={addVideoRow}>
                <Plus size={16} />
                Add video link
              </button>
            </div>
          </div>
          {videoRows.length > 0 && (
            <div className="template-builder-list">
              {videoRows.map((rowId, index) => (
                <div className="template-builder-row" key={rowId}>
                  <div className="template-row-title">
                    <Video size={15} />
                    <span>Video link {index + 1}</span>
                    <button
                      className="icon-button danger"
                      type="button"
                      onClick={() => removeVideoRow(rowId)}
                      aria-label="Remove video link"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                  <input name="videoLink" placeholder="Video URL" type="url" />
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="optional-builder">
          <div className="optional-builder-heading">
            <div>
              <strong>Variations</strong>
              <span>Optional. Add sizes, plans, editions, or bundles with custom prices.</span>
            </div>
            <button className="ghost-button" type="button" onClick={addVariationRow}>
              <Plus size={16} />
              Add variation
            </button>
          </div>
          {variationRows.length > 0 && (
            <div className="template-builder-list">
              {variationRows.map((rowId, index) => (
                <div className="template-builder-row" key={rowId}>
                  <div className="template-row-title">
                    <Boxes size={15} />
                    <span>Variation {index + 1}</span>
                    <button
                      className="icon-button danger"
                      type="button"
                      onClick={() => removeVariationRow(rowId)}
                      aria-label="Remove variation"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                  <div className="variation-fields">
                    <input name="variationName" placeholder="Variation name" />
                    <input name="variationPrice" placeholder="Variation price in PHP" type="number" min="0" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
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
                  <span className="chip" key={variation.id}>{variation.name} - {peso.format(variation.price)}</span>
                ))}
              </div>
              <div className="template-stack">
                {product.media.map((media) => (
                  <a
                    className="mini-template"
                    href={media.url}
                    key={media.id}
                    target="_blank"
                  >
                    <Video size={15} />
                    <span>Video link</span>
                  </a>
                ))}
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
              <span>{entry.secondary || 'No secondary value'} - {today.format(new Date(entry.createdAt))}</span>
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

function TemplatesView({
  products,
  templates,
  onAdd,
}: {
  products: Product[]
  templates: EmailTemplate[]
  onAdd: (template: { productId: string; subject: string; content: string }) => void
}) {
  const [showForm, setShowForm] = useState(false)

  return (
    <section className="template-page">
      <div className="template-toolbar">
        <div>
          <h2>Email templates</h2>
          <p>Create reusable subjects and content, then optionally link them to a product.</p>
        </div>
        <button className="primary-button" type="button" onClick={() => setShowForm((current) => !current)}>
          <Plus size={17} />
          {showForm ? 'Hide template form' : 'Create email template'}
        </button>
      </div>

      {showForm && (
        <form
          className="command-panel"
          onSubmit={(event) => {
            event.preventDefault()
            const data = new FormData(event.currentTarget)
            onAdd({
              productId: String(data.get('productId') || ''),
              subject: String(data.get('subject') || ''),
              content: String(data.get('content') || ''),
            })
            event.currentTarget.reset()
            setShowForm(false)
          }}
        >
          <div className="panel-heading">
            <Mail size={19} />
            <div>
              <h2>New email template</h2>
              <p>Linking to a product is optional.</p>
            </div>
          </div>
          <select name="productId" defaultValue="">
            <option value="">No linked product</option>
            {products.map((product) => (
              <option value={product.id} key={product.id}>
                {product.name}
              </option>
            ))}
          </select>
          <input name="subject" placeholder="Subject name" required />
          <textarea name="content" placeholder="Subject content" rows={6} required />
          <button className="primary-button" type="submit">
            <Plus size={17} />
            Save template
          </button>
        </form>
      )}

      <div className="template-grid">
        {templates.map((template) => (
          <article className="template-card" key={template.id}>
            <div className="template-icon">
              <FileText size={20} />
            </div>
            <span>{template.productName || 'No linked product'}</span>
            <h3>{template.subject}</h3>
            <p>{template.content}</p>
          </article>
        ))}
      </div>
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

async function uploadProductImage(file: File, userId: string) {
  const extension = file.name.split('.').pop() || 'jpg'
  const path = `${userId}/${crypto.randomUUID()}.${extension}`
  const { error } = await supabase.storage.from('product-images').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  })

  if (error) {
    throw new Error(error.message)
  }

  const { data } = supabase.storage.from('product-images').getPublicUrl(path)
  return data.publicUrl
}

function mapProductRow(row: ProductRow, linkedTemplates: EmailTemplate[]): Product {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    price: Number(row.price_php),
    image:
      row.image_url ||
      'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=900&q=80',
    media: (row.product_media ?? []).map((media) => ({
      id: media.id,
      type: media.media_type,
      url: media.url,
    })),
    variations: (row.product_variations ?? []).map((variation) => ({
      id: variation.id,
      name: variation.name,
      price: Number(variation.price_php),
    })),
    emailTemplates: linkedTemplates,
  }
}

function mapEmailTemplateRow(row: EmailTemplateRow): EmailTemplate {
  const linkedProduct = Array.isArray(row.products) ? row.products[0] : row.products

  return {
    id: row.id,
    productId: row.product_id ?? '',
    productName: linkedProduct?.name ?? '',
    subject: row.subject,
    content: row.content,
  }
}

function mapCredentialRow(row: CredentialRow): InventoryEntry {
  return {
    id: row.id,
    primary: row.primary_value,
    secondary: row.secondary_value ?? '',
    createdAt: row.created_at,
  }
}

function mapTroubleshootingRow(row: TroubleshootingRow): TroubleshootingItem {
  return {
    id: row.id,
    errorName: row.error_name,
    errorImage: row.error_image_url ?? '',
    fix: row.fix,
    fixImage: row.fix_image_url ?? '',
  }
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
