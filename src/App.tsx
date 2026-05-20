import { useEffect, useMemo, useRef, useState } from 'react'
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
  LoaderCircle,
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
  X,
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
  category: TemplateCategory
  subject: string
  content: string
}

type TemplateCategory = 'Windows' | 'Mac' | 'General'

type ProductMedia = {
  id: string
  type: 'image' | 'video'
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
  kind: 'microsoft_365' | 'windows_key'
  primary: string
  secondary: string
  createdAt: string
}

type CutHistoryEntry = {
  id: string
  kind: 'microsoft_365' | 'windows_key'
  primary: string
  secondary: string
  copiedText: string
  defective: boolean
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
}

type CutHistoryRow = {
  id: string
  kind: 'microsoft_365' | 'windows_key'
  primary_value: string
  secondary_value: string | null
  copied_text: string
  defective: boolean
  created_at: string
}

type ProductMediaRow = {
  id: string
  product_id: string
  media_type: 'image' | 'video'
  url: string
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
  category: TemplateCategory | null
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
  const [products, setProducts] = useState<Product[]>([])
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([])
  const [accounts365, setAccounts365] = useState<InventoryEntry[]>([])
  const [windowsKeys, setWindowsKeys] = useState<InventoryEntry[]>([])
  const [cutHistory, setCutHistory] = useState<CutHistoryEntry[]>([])
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
        setCutHistory([])
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

    const channel = supabase
      .channel(`shoply-inventory-${session.user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'inventory_credentials',
          filter: `user_id=eq.${session.user.id}`,
        },
        () => loadShoplyData(session.user.id),
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'inventory_cut_history',
          filter: `user_id=eq.${session.user.id}`,
        },
        () => loadShoplyData(session.user.id),
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
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
    const [
      productsResult,
      templatesResult,
      mediaResult,
      credentialsResult,
      cutHistoryResult,
      notesResult,
      salesResult,
      troubleshootingResult,
    ] = await Promise.all([
      supabase
        .from('products')
        .select('id,name,description,price_php,image_url,product_variations(id,name,price_php)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),
      supabase
        .from('email_templates')
        .select('id,product_id,subject,content,products(name)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),
      supabase
        .from('product_media')
        .select('id,product_id,media_type,url'),
      supabase
        .from('inventory_credentials')
        .select('id,kind,primary_value,secondary_value,created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),
      supabase
        .from('inventory_cut_history')
        .select('id,kind,primary_value,secondary_value,copied_text,defective,created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(30),
      supabase.from('notes').select('id,title,body').eq('user_id', userId).order('created_at', { ascending: false }),
      supabase.from('sales').select('id,item,amount_php,status').eq('user_id', userId).order('created_at', { ascending: false }),
      supabase
        .from('troubleshooting')
        .select('id,error_name,error_image_url,fix,fix_image_url')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),
    ])

    const mediaMissing =
      mediaResult.error?.message.includes("Could not find the table 'public.product_media'") ||
      mediaResult.error?.message.includes("product_media")
    const firstError =
      productsResult.error ??
      templatesResult.error ??
      (mediaMissing ? null : mediaResult.error) ??
      credentialsResult.error ??
      (cutHistoryResult.error?.message.includes('inventory_cut_history')
        ? null
        : cutHistoryResult.error) ??
      notesResult.error ??
      salesResult.error ??
      troubleshootingResult.error

    if (firstError) {
      setAuthMessage(firstError.message)
      return
    }

    const productRows = (productsResult.data ?? []) as ProductRow[]
    const templateRows = (templatesResult.data ?? []) as EmailTemplateRow[]
    const mediaRows = mediaMissing ? [] : ((mediaResult.data ?? []) as ProductMediaRow[])
    const credentialRows = (credentialsResult.data ?? []) as CredentialRow[]
    const cutHistoryRows = (cutHistoryResult.data ?? []) as CutHistoryRow[]
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
          mediaRows.filter((media) => media.product_id === product.id),
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
    setCutHistory(cutHistoryRows.map(mapCutHistoryRow))
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
    setAuthMessage(
      mediaMissing
        ? 'Data loaded. Run the product_media SQL migration to enable video links.'
        : `Saved data loaded for ${session?.user.email ?? 'your account'}.`,
    )
  }

  async function addProduct(formData: FormData) {
    if (!session) {
      setAuthMessage('Sign in before adding products.')
      return false
    }

    setAuthMessage('Creating product...')

    let uploadedImages: { coverImageUrl: string; extraImageUrls: string[] }

    try {
      const coverImage = formData.get('coverImage')
      const extraImages = formData
        .getAll('productImages')
        .filter((value): value is File => value instanceof File && value.size > 0)

      uploadedImages = {
        coverImageUrl:
          coverImage instanceof File && coverImage.size > 0
            ? await uploadProductImage(coverImage, session.user.id)
            : '',
        extraImageUrls: await Promise.all(
          extraImages.map((file) => uploadProductImage(file, session.user.id)),
        ),
      }
    } catch (error) {
      setAuthMessage(
        error instanceof Error
          ? `Image upload failed: ${error.message}`
          : 'Image upload failed.',
      )
      return false
    }

    const productInput = {
      name: String(formData.get('name') || 'Untitled product'),
      description: String(formData.get('description') || 'No description added.'),
      price_php: Number(formData.get('price') || 0),
      image_url: uploadedImages.coverImageUrl || uploadedImages.extraImageUrls[0] || '',
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
    const mediaLinks: Array<{ media_type: 'image' | 'video'; url: string }> = [
      ...uploadedImages.extraImageUrls.map((url) => ({ media_type: 'image' as const, url })),
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
      return false
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
      return false
    }

    await loadShoplyData(session.user.id)
    setAuthMessage('Product created successfully.')
    return true
  }

  async function deleteProduct(id: string) {
    if (!session) return
    setAuthMessage('Deleting product...')
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (error) {
      setAuthMessage(error.message)
      return
    }
    await loadShoplyData(session.user.id)
    setAuthMessage('Product deleted successfully.')
  }

  async function updateProduct(id: string, formData: FormData) {
    if (!session) {
      setAuthMessage('Sign in before editing products.')
      return false
    }

    setAuthMessage('Saving product changes...')
    let imageUrl = String(formData.get('existingImage') || '')

    try {
      const coverImage = formData.get('coverImage')
      if (coverImage instanceof File && coverImage.size > 0) {
        imageUrl = await uploadProductImage(coverImage, session.user.id)
      }
    } catch (error) {
      setAuthMessage(
        error instanceof Error ? `Image upload failed: ${error.message}` : 'Image upload failed.',
      )
      return false
    }

    const { error } = await supabase
      .from('products')
      .update({
        name: String(formData.get('name') || 'Untitled product'),
        description: String(formData.get('description') || ''),
        price_php: Number(formData.get('price') || 0),
        image_url: imageUrl,
      })
      .eq('id', id)

    if (error) {
      setAuthMessage(error.message)
      return false
    }

    await loadShoplyData(session.user.id)
    setAuthMessage('Product updated successfully.')
    return true
  }

  async function replaceInventoryText(value: string, type: '365' | 'windows') {
    if (!session) {
      setAuthMessage('Sign in before editing inventory.')
      return false
    }
    const rows = parseInventoryLines(value)
    const kind = type === '365' ? 'microsoft_365' : 'windows_key'
    setAuthMessage('Saving inventory...')

    const { error: deleteError } = await supabase
      .from('inventory_credentials')
      .delete()
      .eq('user_id', session.user.id)
      .eq('kind', kind)

    if (deleteError) {
      setAuthMessage(formatInventoryError(deleteError.message))
      return false
    }

    if (rows.length) {
      const { error } = await supabase.from('inventory_credentials').insert(
        rows.map((entry) => ({
          user_id: session.user.id,
          kind,
          primary_value: entry.primary,
          secondary_value: entry.secondary,
        })),
      )
      if (error) {
        setAuthMessage(formatInventoryError(error.message))
        return false
      }
    }

    await loadShoplyData(session.user.id)
    setAuthMessage('Inventory saved automatically.')
    return true
  }

  async function cutInventoryText(value: string, type: '365' | 'windows', nextText?: string) {
    if (!session) return false
    const rows = parseInventoryLines(value)
    const entry = rows[0]
    if (!entry) {
      setAuthMessage('No inventory available to cut.')
      return false
    }

    const kind = type === '365' ? 'microsoft_365' : 'windows_key'
    const copiedText =
      type === '365'
        ? `${entry.primary}\n${entry.secondary}`.trim()
        : entry.primary
    const remainingText = nextText ?? inventoryRowsToText(rows.slice(1))

    setAuthMessage('Cutting inventory...')
    await navigator.clipboard.writeText(copiedText)

    const { error: historyError } = await supabase.from('inventory_cut_history').insert({
      user_id: session.user.id,
      kind,
      primary_value: entry.primary,
      secondary_value: entry.secondary,
      copied_text: copiedText,
    })

    const saved = await replaceInventoryText(remainingText, type)
    if (!saved) return false
    setAuthMessage(
      historyError
        ? 'Inventory cut and copied. Cut history needs the Supabase cut history RLS SQL fix.'
        : 'Inventory cut and copied successfully.',
    )
    return true
  }

  async function toggleCutDefective(id: string, defective: boolean) {
    if (!session) return
    const { error } = await supabase
      .from('inventory_cut_history')
      .update({ defective })
      .eq('id', id)

    if (error) {
      setAuthMessage(error.message)
      return
    }

    await loadShoplyData(session.user.id)
    setAuthMessage('Cut history updated successfully.')
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
    category: TemplateCategory
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
      category: template.category,
      subject: template.subject,
      content: template.content,
    })

    if (error) {
      setAuthMessage(error.message)
      return
    }

    await loadShoplyData(session.user.id)
    setAuthMessage('Template saved successfully.')
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

        {view === 'products' && (
          <ProductsView
            products={filteredProducts}
            onAddProduct={addProduct}
            onDeleteProduct={deleteProduct}
            onUpdateProduct={updateProduct}
          />
        )}
        {view === 'accounts' && (
          <AccountsView
            accounts365={accounts365}
            windowsKeys={windowsKeys}
            cutHistory={cutHistory}
            onReplace={replaceInventoryText}
            onCut={cutInventoryText}
            onToggleDefective={toggleCutDefective}
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
  onUpdateProduct,
}: {
  products: Product[]
  onAddProduct: (formData: FormData) => boolean | Promise<boolean>
  onDeleteProduct: (id: string) => void | Promise<void>
  onUpdateProduct: (id: string, formData: FormData) => boolean | Promise<boolean>
}) {
  const [productMode, setProductMode] = useState<'create' | 'manage'>('manage')
  const [editingProductId, setEditingProductId] = useState('')
  const [creatingProduct, setCreatingProduct] = useState(false)
  const [deletingProductId, setDeletingProductId] = useState('')
  const [savingProductId, setSavingProductId] = useState('')
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
    <section className="products-page">
      <div className="quick-tabs" role="tablist" aria-label="Product mode">
        <button
          className={productMode === 'create' ? 'active' : ''}
          onClick={() => setProductMode('create')}
          role="tab"
          type="button"
          aria-selected={productMode === 'create'}
        >
          <PackagePlus size={17} />
          Create product
        </button>
        <button
          className={productMode === 'manage' ? 'active' : ''}
          onClick={() => setProductMode('manage')}
          role="tab"
          type="button"
          aria-selected={productMode === 'manage'}
        >
          <Boxes size={17} />
          View / quick edit
        </button>
      </div>

      {productMode === 'create' && (
        <form
          className="command-panel"
          onSubmit={async (event) => {
            event.preventDefault()
            setCreatingProduct(true)
            try {
              const created = await onAddProduct(new FormData(event.currentTarget))
              if (!created) return
              event.currentTarget.reset()
              setVariationRows([])
              setVideoRows([])
              setProductMode('manage')
            } finally {
              setCreatingProduct(false)
            }
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
        <input name="price" placeholder="Base price in PHP (optional when variations exist)" type="number" min="0" />
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
        <button className="primary-button" type="submit" disabled={creatingProduct}>
          {creatingProduct ? <LoaderCircle className="spin-icon" size={17} /> : <Plus size={17} />}
          {creatingProduct ? 'Adding product...' : 'Add product'}
        </button>
        </form>
      )}

      {productMode === 'manage' && (
        <div className="manage-products-panel">
          {products.length === 0 ? (
            <div className="empty-state">
              <Boxes size={22} />
              <h2>No products yet</h2>
              <p>Create your first product, then return here for quick viewing and edits.</p>
              <button className="primary-button" type="button" onClick={() => setProductMode('create')}>
                <Plus size={17} />
                Create product
              </button>
            </div>
          ) : (
            <div className="product-grid">
              {products.map((product) => (
                <article className={`product-card ${deletingProductId === product.id ? 'is-busy' : ''}`} key={product.id}>
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
                        media.type === 'image' ? (
                          <a className="mini-template media-thumb" href={media.url} key={media.id} target="_blank">
                            <img src={media.url} alt="" />
                            <span>Image</span>
                          </a>
                        ) : (
                          <a
                            className="mini-template"
                            href={media.url}
                            key={media.id}
                            target="_blank"
                          >
                            <Video size={15} />
                            <span>Video link</span>
                          </a>
                        )
                      ))}
                      {product.emailTemplates.map((template) => (
                        <div className="mini-template" key={template.id}>
                          <Mail size={15} />
                          <span>{template.subject}</span>
                        </div>
                      ))}
                    </div>
                    {editingProductId === product.id ? (
                      <form
                        className="quick-edit-form"
                        onSubmit={async (event) => {
                          event.preventDefault()
                          setSavingProductId(product.id)
                          try {
                            const updated = await onUpdateProduct(product.id, new FormData(event.currentTarget))
                            if (updated) setEditingProductId('')
                          } finally {
                            setSavingProductId('')
                          }
                        }}
                      >
                        <input name="existingImage" type="hidden" value={product.image} />
                        <input name="name" defaultValue={product.name} placeholder="Product name" />
                        <textarea name="description" defaultValue={product.description} rows={3} placeholder="Description" />
                        <input name="price" defaultValue={product.price || ''} type="number" min="0" placeholder="Base price" />
                        <label className="file-field">
                          <span>Replace cover image</span>
                          <input name="coverImage" type="file" accept="image/*" />
                        </label>
                        <div className="copy-actions">
                          <button className="primary-button" type="submit" disabled={savingProductId === product.id}>
                            {savingProductId === product.id && <LoaderCircle className="spin-icon" size={16} />}
                            {savingProductId === product.id ? 'Saving...' : 'Save'}
                          </button>
                          <button className="ghost-button" type="button" onClick={() => setEditingProductId('')} disabled={savingProductId === product.id}>Cancel</button>
                        </div>
                      </form>
                    ) : (
                      <div className="copy-actions">
                        <button className="ghost-button" type="button" onClick={() => setEditingProductId(product.id)} disabled={deletingProductId === product.id}>
                          Edit
                        </button>
                        <button
                          className="ghost-button danger"
                          type="button"
                          disabled={deletingProductId === product.id}
                          onClick={async () => {
                            setDeletingProductId(product.id)
                            try {
                              await onDeleteProduct(product.id)
                            } finally {
                              setDeletingProductId('')
                            }
                          }}
                        >
                          {deletingProductId === product.id ? <LoaderCircle className="spin-icon" size={16} /> : <Trash2 size={16} />}
                          {deletingProductId === product.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  )
}

function AccountsView({
  accounts365,
  windowsKeys,
  cutHistory,
  onReplace,
  onCut,
  onToggleDefective,
}: {
  accounts365: InventoryEntry[]
  windowsKeys: InventoryEntry[]
  cutHistory: CutHistoryEntry[]
  onReplace: (value: string, type: '365' | 'windows') => boolean | Promise<boolean>
  onCut: (value: string, type: '365' | 'windows', nextText?: string) => boolean | Promise<boolean>
  onToggleDefective: (id: string, defective: boolean) => void | Promise<void>
}) {
  const [mode, setMode] = useState<'365' | 'windows'>('365')
  const [accountDraft, setAccountDraft] = useState<string | null>(null)
  const [keyDraft, setKeyDraft] = useState<string | null>(null)
  const [focusedMode, setFocusedMode] = useState<'365' | 'windows' | ''>('')
  const [savingMode, setSavingMode] = useState<'365' | 'windows' | ''>('')
  const [cuttingMode, setCuttingMode] = useState<'365' | 'windows' | ''>('')
  const [showHistory, setShowHistory] = useState(false)
  const [localCutHistory, setLocalCutHistory] = useState<CutHistoryEntry[]>([])
  const autosaveTimer = useRef<number | null>(null)
  const lastAutosaveText = useRef<Record<'365' | 'windows', string>>({
    '365': '',
    windows: '',
  })
  const onReplaceRef = useRef(onReplace)

  const is365 = mode === '365'
  const savedText365 = useMemo(() => entriesToText(accounts365), [accounts365])
  const savedTextWindows = useMemo(() => entriesToText(windowsKeys), [windowsKeys])
  const activeText = is365 ? accountDraft ?? savedText365 : keyDraft ?? savedTextWindows
  const parsedEntries = useMemo(() => parseInventoryLines(activeText), [activeText])
  const kind = is365 ? 'microsoft_365' : 'windows_key'
  const history = [...localCutHistory, ...cutHistory]
    .filter((entry, index, entries) => entry.kind === kind && entries.findIndex((item) => item.id === entry.id) === index)
    .slice(0, 30)
  const label = is365 ? '365 account' : 'Windows key'

  useEffect(() => {
    onReplaceRef.current = onReplace
  }, [onReplace])

  useEffect(() => {
    const savedText = mode === '365' ? savedText365 : savedTextWindows
    if (activeText === savedText) return
    if (activeText === lastAutosaveText.current[mode]) return

    if (autosaveTimer.current) window.clearTimeout(autosaveTimer.current)
    autosaveTimer.current = window.setTimeout(async () => {
      lastAutosaveText.current[mode] = activeText
      setSavingMode(mode)
      try {
        const saved = await onReplaceRef.current(activeText, mode)
        if (saved && focusedMode !== mode) {
          if (mode === '365') setAccountDraft(null)
          if (mode === 'windows') setKeyDraft(null)
        }
      } finally {
        setSavingMode('')
      }
    }, 650)

    return () => {
      if (autosaveTimer.current) window.clearTimeout(autosaveTimer.current)
    }
  }, [activeText, focusedMode, mode, savedText365, savedTextWindows])

  const updateActiveText = (value: string) => {
    if (is365) {
      setAccountDraft(value)
      return
    }
    setKeyDraft(value)
  }

  return (
    <section className="accounts-page">
      <article className="command-panel">
        <div className="panel-heading">
          <KeyRound size={19} />
          <div>
            <h2>Accounts & keys</h2>
            <p>Paste rows in bulk, then cut the next available item into your clipboard.</p>
          </div>
        </div>

        <div className="quick-tabs compact-tabs">
          <button type="button" className={is365 ? 'active' : ''} onClick={() => setMode('365')}>
            365 Accounts
          </button>
          <button type="button" className={!is365 ? 'active' : ''} onClick={() => setMode('windows')}>
            Windows Keys
          </button>
        </div>

        <div className="inventory-actions">
          <button
            className="primary-button"
            type="button"
            onClick={async () => {
              if (autosaveTimer.current) window.clearTimeout(autosaveTimer.current)
              const remainingText = inventoryRowsToText(parsedEntries.slice(1))
              lastAutosaveText.current[mode] = remainingText
              updateActiveText(remainingText)
              setCuttingMode(mode)
              try {
                const cut = await onCut(activeText, mode, remainingText)
                if (cut) {
                  const copiedText =
                    mode === '365'
                      ? `${parsedEntries[0].primary}\n${parsedEntries[0].secondary}`.trim()
                      : parsedEntries[0].primary
                  setLocalCutHistory((current) => [
                    {
                      id: `local-${crypto.randomUUID()}`,
                      kind: kind as CutHistoryEntry['kind'],
                      primary: parsedEntries[0].primary,
                      secondary: parsedEntries[0].secondary,
                      copiedText,
                      defective: false,
                      createdAt: new Date().toISOString(),
                    },
                    ...current,
                  ].slice(0, 30))
                }
              } finally {
                setCuttingMode('')
              }
            }}
            disabled={!parsedEntries.length || cuttingMode === mode}
          >
            {cuttingMode === mode ? <LoaderCircle className="spin-icon" size={17} /> : <Copy size={17} />}
            {cuttingMode === mode ? 'Cutting...' : `Cut next ${label}`}
          </button>
        </div>

        <div className="bulk-form">
          <textarea
            value={activeText}
            onChange={(event) => updateActiveText(event.target.value)}
            onFocus={() => setFocusedMode(mode)}
            onBlur={() => setFocusedMode('')}
            placeholder={
              is365
                ? '47952@officekit.co Mue05899\n47953@officekit.co Efi17020'
                : '42XNQ-FKD7H-WGRMB-YXG6X-JXCKG 03308-162-886-137\n46KBT-NH99D-P26RQ-YXK7Q-3PFC6 03308-019-869-135'
            }
            rows={8}
          />
          <span className="autosave-state">
            {savingMode === mode ? (
              <>
                <LoaderCircle className="spin-icon" size={14} />
                Saving inventory...
              </>
            ) : (
              `${parsedEntries.length} ${parsedEntries.length === 1 ? 'line' : 'lines'} ready`
            )}
          </span>
          <button className="ghost-button" type="button" onClick={() => setShowHistory(true)}>
            Last 30 cuts
          </button>
        </div>
      </article>

      {showHistory && (
        <div className="modal-backdrop" role="presentation" onClick={() => setShowHistory(false)}>
          <article className="history-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <div className="modal-heading">
              <div>
                <h2>Last 30 cuts</h2>
                <p>{is365 ? '365 accounts' : 'Windows keys'}</p>
              </div>
              <button className="icon-button" type="button" onClick={() => setShowHistory(false)} aria-label="Close history">
                <X size={18} />
              </button>
            </div>
            <div className="history-list">
              {history.map((entry) => (
                <div className="history-row" key={entry.id}>
                  <div>
                    <strong>{entry.primary}</strong>
                    <span>{entry.secondary || 'Copied primary only'} - {today.format(new Date(entry.createdAt))}</span>
                  </div>
                  <label className="toggle-row">
                    <input
                      type="checkbox"
                      checked={entry.defective}
                      onChange={(event) => {
                        if (entry.id.startsWith('local-')) {
                          setLocalCutHistory((current) =>
                            current.map((item) =>
                              item.id === entry.id ? { ...item, defective: event.target.checked } : item,
                            ),
                          )
                          return
                        }
                        onToggleDefective(entry.id, event.target.checked)
                      }}
                    />
                    <span aria-hidden="true" className="toggle-track">
                      <span className="toggle-thumb" />
                    </span>
                    <span>Defective</span>
                  </label>
                </div>
              ))}
              {!history.length && <p className="empty-state">No cut history yet.</p>}
            </div>
          </article>
        </div>
      )}
    </section>
  )
}

function TemplatesView({
  products,
  templates,
  onAdd,
}: {
  products: Product[]
  templates: EmailTemplate[]
  onAdd: (template: { productId: string; category: TemplateCategory; subject: string; content: string }) => void
}) {
  const [showForm, setShowForm] = useState(false)
  const [copiedButton, setCopiedButton] = useState('')

  async function copyTemplateValue(value: string, key: string) {
    await navigator.clipboard.writeText(value)
    setCopiedButton('')
    window.setTimeout(() => setCopiedButton(key), 0)
    window.setTimeout(() => {
      setCopiedButton((current) => (current === key ? '' : current))
    }, 900)
  }

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
              category: String(data.get('category') || 'General') as TemplateCategory,
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
          <select name="category" defaultValue="General">
            <option>General</option>
            <option>Windows</option>
            <option>Mac</option>
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
          <article className={`template-card ${categoryClass(template.category)}`} key={template.id}>
            <div className="template-icon">
              <FileText size={20} />
            </div>
            <span>{template.category} - {template.productName || 'No linked product'}</span>
            <div className="copy-actions">
              <button
                className={`ghost-button ${copiedButton === `${template.id}-subject` ? 'copy-glow' : ''}`}
                type="button"
                onClick={() => copyTemplateValue(template.subject, `${template.id}-subject`)}
              >
                Copy Subject
              </button>
              <button
                className={`ghost-button ${copiedButton === `${template.id}-content` ? 'copy-glow' : ''}`}
                type="button"
                onClick={() => copyTemplateValue(template.content, `${template.id}-content`)}
              >
                Copy Content
              </button>
            </div>
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

async function uploadProductImage(file: File, userId: string) {
  const extension = file.name.split('.').pop() || 'jpg'
  const path = `${userId}/${crypto.randomUUID()}.${extension}`
  const { error } = await supabase.storage.from('product-images').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  })

  if (error) {
    if (error.message.toLowerCase().includes('bucket not found')) {
      throw new Error('Bucket not found. Run the Supabase storage SQL migration for product-images.')
    }
    throw new Error(error.message)
  }

  const { data } = supabase.storage.from('product-images').getPublicUrl(path)
  return data.publicUrl
}

function mapProductRow(
  row: ProductRow,
  linkedTemplates: EmailTemplate[],
  linkedMedia: ProductMediaRow[],
): Product {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    price: Number(row.price_php),
    image:
      row.image_url ||
      'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=900&q=80',
    media: linkedMedia.map((media) => ({
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
    category: row.category ?? 'General',
    subject: row.subject,
    content: row.content,
  }
}

function mapCredentialRow(row: CredentialRow): InventoryEntry {
  return {
    id: row.id,
    kind: row.kind,
    primary: row.primary_value,
    secondary: row.secondary_value ?? '',
    createdAt: row.created_at,
  }
}

function mapCutHistoryRow(row: CutHistoryRow): CutHistoryEntry {
  return {
    id: row.id,
    kind: row.kind,
    primary: row.primary_value,
    secondary: row.secondary_value ?? '',
    copiedText: row.copied_text,
    defective: row.defective,
    createdAt: row.created_at,
  }
}

function parseInventoryLines(value: string): Array<{ primary: string; secondary: string }> {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [primary = '', ...rest] = line.split(/\s+/)
      return {
        primary,
        secondary: rest.join(' '),
      }
    })
    .filter((entry) => entry.primary)
}

function inventoryRowsToText(rows: Array<{ primary: string; secondary: string }>) {
  return rows
    .map((entry) => [entry.primary, entry.secondary].filter(Boolean).join(' '))
    .join('\n')
}

function entriesToText(entries: InventoryEntry[]) {
  return inventoryRowsToText(entries)
}

function formatInventoryError(message: string) {
  if (message.toLowerCase().includes('row-level security')) {
    return 'Inventory save blocked by Supabase RLS. Run supabase/fix-inventory-credentials-rls.sql in SQL Editor.'
  }

  return message
}

function categoryClass(category: TemplateCategory) {
  return `template-${category.toLowerCase()}`
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
