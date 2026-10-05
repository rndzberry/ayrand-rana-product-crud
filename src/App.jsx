import { useEffect, useMemo, useState } from 'react'
import {
  ArrowDownUp,
  Boxes,
  Check,
  CircleAlert,
  LoaderCircle,
  LogOut,
  Package,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react'
import './App.css'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/+$/, '')

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  })

  let result
  try {
    result = await response.json()
  } catch {
    throw new Error(`The API returned an invalid response (${response.status}).`)
  }

  if (!response.ok) {
    const error = new Error(result.error || result.message || `Request failed (${response.status}).`)
    error.status = response.status
    throw error
  }

  return result
}

const emptyProduct = {
  product_name: '',
  description: '',
  price: '',
  quantity: '',
}

function formatPrice(value) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format(Number(value) || 0)
}

function App() {
  const [user, setUser] = useState(null)
  const [products, setProducts] = useState([])
  const [checkingSession, setCheckingSession] = useState(true)
  const [working, setWorking] = useState(false)
  const [notice, setNotice] = useState('')
  const [noticeType, setNoticeType] = useState('error')
  const [search, setSearch] = useState('')
  const [dialog, setDialog] = useState(null)
  const [productForm, setProductForm] = useState(emptyProduct)
  const [credentials, setCredentials] = useState({ username: '', password: '' })

  useEffect(() => {
    let active = true

    async function restoreSession() {
      try {
        const auth = await apiRequest('/auth')
        if (!active) return
        setUser(auth.data)

        const response = await apiRequest('/products')
        if (active) setProducts(Array.isArray(response.data) ? response.data : [])
      } catch (error) {
        if (active && error.status !== 401) {
          setNotice(error.message)
          setNoticeType('error')
        }
      } finally {
        if (active) setCheckingSession(false)
      }
    }

    restoreSession()
    return () => {
      active = false
    }
  }, [])

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return products

    return products.filter((product) =>
      [product.product_name, product.description, product.id]
        .some((value) => String(value ?? '').toLowerCase().includes(query)),
    )
  }, [products, search])

  function showSuccess(message) {
    setNotice(message)
    setNoticeType('success')
  }

  async function handleLogin(event) {
    event.preventDefault()
    setWorking(true)
    setNotice('')

    try {
      const response = await apiRequest('/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      })
      setUser(response.data)
      const productsResponse = await apiRequest('/products')
      setProducts(Array.isArray(productsResponse.data) ? productsResponse.data : [])
      showSuccess('You are signed in. Your product inventory is ready.')
    } catch (error) {
      setNotice(error.message)
      setNoticeType('error')
    } finally {
      setWorking(false)
    }
  }

  async function handleLogout() {
    setWorking(true)
    setNotice('')

    try {
      await apiRequest('/logout', { method: 'POST' })
      setUser(null)
      setProducts([])
      setCredentials({ username: '', password: '' })
      setNotice('')
    } catch (error) {
      setNotice(error.message)
      setNoticeType('error')
    } finally {
      setWorking(false)
    }
  }

  function openCreateDialog() {
    setProductForm(emptyProduct)
    setDialog({ mode: 'create' })
    setNotice('')
  }

  function openEditDialog(product) {
    setProductForm({
      product_name: product.product_name ?? '',
      description: product.description ?? '',
      price: String(product.price ?? ''),
      quantity: String(product.quantity ?? ''),
    })
    setDialog({ mode: 'edit', product })
    setNotice('')
  }

  async function handleSaveProduct(event) {
    event.preventDefault()
    if (!dialog) return

    setWorking(true)
    setNotice('')
    const isEditing = dialog.mode === 'edit'
    const path = isEditing ? `/products/${dialog.product.id}` : '/products'

    try {
      await apiRequest(path, {
        method: isEditing ? 'PUT' : 'POST',
        body: JSON.stringify({
          ...productForm,
          price: Number(productForm.price),
          quantity: Number(productForm.quantity),
        }),
      })
      const response = await apiRequest('/products')
      setProducts(Array.isArray(response.data) ? response.data : [])
      setDialog(null)
      showSuccess(isEditing ? 'Product updated successfully.' : 'Product added successfully.')
    } catch (error) {
      setNotice(error.message)
      setNoticeType('error')
    } finally {
      setWorking(false)
    }
  }

  async function handleDeleteProduct() {
    if (!dialog?.product) return

    setWorking(true)
    setNotice('')
    try {
      await apiRequest(`/products/${dialog.product.id}`, { method: 'DELETE' })
      setProducts((current) => current.filter((product) => product.id !== dialog.product.id))
      setDialog(null)
      showSuccess('Product deleted successfully.')
    } catch (error) {
      setNotice(error.message)
      setNoticeType('error')
    } finally {
      setWorking(false)
    }
  }

  if (checkingSession) {
    return (
      <main className="page-loading">
        <LoaderCircle className="spin" size={28} aria-hidden="true" />
        <span>Connecting to the LavaLust API...</span>
      </main>
    )
  }

  if (!user) {
    return (
      <main className="login-layout">
        <section className="login-brand">
          <div className="brand-lockup">
            <span className="brand-mark"><Boxes size={22} /></span>
            <span>Stockroom</span>
          </div>
          <div className="login-story">
            <span className="eyebrow light-eyebrow">PRODUCT MANAGEMENT</span>
            <h1>Your inventory,<br />in good hands.</h1>
            <p>Keep products organized and up to date in one simple workspace.</p>
          </div>
          <div className="login-footnote"><ShieldCheck size={16} /> Protected by your LavaLust API</div>
        </section>

        <section className="login-panel">
          <form className="login-card" onSubmit={handleLogin}>
            <div className="mobile-brand brand-lockup">
              <span className="brand-mark"><Boxes size={22} /></span>
              <span>Stockroom</span>
            </div>
            <span className="eyebrow">WELCOME BACK</span>
            <h2>Sign in to your account</h2>
            <p className="muted">Use your Activity 5 account to continue.</p>

            {notice && <Notice message={notice} type={noticeType} />}

            <label className="field-label" htmlFor="username">Username</label>
            <input
              id="username"
              name="username"
              autoComplete="username"
              value={credentials.username}
              onChange={(event) => setCredentials({ ...credentials, username: event.target.value })}
              placeholder="Enter your username"
              required
            />

            <label className="field-label" htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={credentials.password}
              onChange={(event) => setCredentials({ ...credentials, password: event.target.value })}
              placeholder="Enter your password"
              required
            />

            <button className="button button-primary login-submit" type="submit" disabled={working}>
              {working ? <LoaderCircle className="spin" size={18} /> : 'Sign in'}
            </button>
            <p className="secure-caption"><ShieldCheck size={15} /> Your session is handled securely by the backend.</p>
          </form>
        </section>
      </main>
    )
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-lockup" aria-label="Stockroom">
          <span className="brand-mark"><Boxes size={22} /></span>
          <span>Stockroom</span>
        </div>
        <div className="sidebar-section-label">WORKSPACE</div>
        <div className="nav-item active"><Package size={18} /> Products <span className="nav-count">{products.length}</span></div>
        <div className="sidebar-bottom">
          <div className="api-status"><span className="status-dot" /> API connected</div>
          <div className="user-card">
            <div className="avatar">{(user.username || 'U').slice(0, 1).toUpperCase()}</div>
            <div className="user-meta"><strong>{user.username}</strong><span>Signed in</span></div>
            <button className="icon-button logout-button" onClick={handleLogout} disabled={working} title="Log out" aria-label="Log out">
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb"><span>Workspace</span><span className="breadcrumb-divider">/</span><strong>Products</strong></div>
          <div className="topbar-right"><span className="live-label"><span className="status-dot" /> LIVE</span></div>
        </header>

        <div className="content-wrap">
          <section className="page-heading">
            <div>
              <span className="eyebrow">INVENTORY</span>
              <h1>Products</h1>
              <p>Manage your catalog, pricing, and stock levels.</p>
            </div>
            <button className="button button-primary" onClick={openCreateDialog}>
              <Plus size={18} /> Add product
            </button>
          </section>

          {notice && <Notice message={notice} type={noticeType} onDismiss={() => setNotice('')} />}

          <section className="summary-grid" aria-label="Inventory summary">
            <article className="summary-card">
              <div className="summary-icon purple"><Package size={19} /></div>
              <span className="summary-label">TOTAL PRODUCTS</span>
              <strong>{products.length}</strong>
              <span className="summary-note">In your catalog</span>
            </article>
            <article className="summary-card">
              <div className="summary-icon green"><ArrowDownUp size={19} /></div>
              <span className="summary-label">UNITS IN STOCK</span>
              <strong>{products.reduce((total, item) => total + (Number(item.quantity) || 0), 0).toLocaleString()}</strong>
              <span className="summary-note">Across all products</span>
            </article>
            <article className="summary-card">
              <div className="summary-icon orange"><Boxes size={19} /></div>
              <span className="summary-label">LOW STOCK</span>
              <strong>{products.filter((item) => Number(item.quantity) <= 5).length}</strong>
              <span className="summary-note">5 units or fewer</span>
            </article>
          </section>

          <section className="catalog-card">
            <div className="catalog-header">
              <div>
                <h2>Product catalog</h2>
                <p>{filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'} shown</p>
              </div>
              <label className="search-field">
                <Search size={17} aria-hidden="true" />
                <input
                  type="search"
                  placeholder="Search products..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  aria-label="Search products"
                />
              </label>
            </div>

            {filteredProducts.length > 0 ? (
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>PRODUCT</th>
                      <th>DESCRIPTION</th>
                      <th>PRICE</th>
                      <th>QUANTITY</th>
                      <th className="actions-heading">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((product) => (
                      <tr key={product.id}>
                        <td>
                          <div className="product-cell">
                            <div className="product-avatar"><Package size={17} /></div>
                            <div><strong>{product.product_name}</strong><span>SKU-{String(product.id).padStart(4, '0')}</span></div>
                          </div>
                        </td>
                        <td className="description-cell">{product.description || 'No description'}</td>
                        <td className="price-cell">{formatPrice(product.price)}</td>
                        <td><span className={`quantity-pill ${Number(product.quantity) <= 5 ? 'low-quantity' : ''}`}>{product.quantity} in stock</span></td>
                        <td>
                          <div className="row-actions">
                            <button className="icon-button" onClick={() => openEditDialog(product)} title={`Edit ${product.product_name}`} aria-label={`Edit ${product.product_name}`}>
                              <Pencil size={16} />
                            </button>
                            <button className="icon-button danger-action" onClick={() => setDialog({ mode: 'delete', product })} title={`Delete ${product.product_name}`} aria-label={`Delete ${product.product_name}`}>
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon"><Package size={24} /></div>
                <h3>{search ? 'No matching products' : 'Your catalog is ready'}</h3>
                <p>{search ? 'Try another name or product ID.' : 'Add your first product to start tracking your inventory.'}</p>
                {!search && <button className="button button-secondary" onClick={openCreateDialog}><Plus size={17} /> Add your first product</button>}
              </div>
            )}
            <div className="catalog-footer"><span>Product data is stored securely in your Aiven database.</span><span>Powered by LavaLust API</span></div>
          </section>
          <footer className="page-footer">STOCKROOM <span>·</span> PRODUCT MANAGEMENT</footer>
        </div>
      </main>

      {dialog?.mode === 'create' || dialog?.mode === 'edit' ? (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget && !working) setDialog(null)
        }}>
          <section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="product-dialog-title">
            <div className="modal-header">
              <div><span className="eyebrow">{dialog.mode === 'edit' ? 'UPDATE CATALOG' : 'NEW CATALOG ITEM'}</span><h2 id="product-dialog-title">{dialog.mode === 'edit' ? 'Edit product' : 'Add a product'}</h2></div>
              <button className="icon-button" onClick={() => setDialog(null)} disabled={working} aria-label="Close dialog"><X size={19} /></button>
            </div>
            <form className="product-form" onSubmit={handleSaveProduct}>
              <label className="field-label" htmlFor="product-name">Product name</label>
              <input id="product-name" autoFocus maxLength={100} value={productForm.product_name} onChange={(event) => setProductForm({ ...productForm, product_name: event.target.value })} placeholder="e.g. Wireless keyboard" required />

              <label className="field-label" htmlFor="product-description">Description <span className="optional-label">OPTIONAL</span></label>
              <textarea id="product-description" rows={3} value={productForm.description} onChange={(event) => setProductForm({ ...productForm, description: event.target.value })} placeholder="Add a short product description" />

              <div className="form-row">
                <div><label className="field-label" htmlFor="product-price">Price (PHP)</label><input id="product-price" type="number" min="0" max="99999999.99" step="0.01" value={productForm.price} onChange={(event) => setProductForm({ ...productForm, price: event.target.value })} placeholder="0.00" required /></div>
                <div><label className="field-label" htmlFor="product-quantity">Quantity</label><input id="product-quantity" type="number" min="0" max="2147483647" step="1" value={productForm.quantity} onChange={(event) => setProductForm({ ...productForm, quantity: event.target.value })} placeholder="0" required /></div>
              </div>

              {notice && <Notice message={notice} type={noticeType} />}
              <div className="modal-actions">
                <button type="button" className="button button-quiet" onClick={() => setDialog(null)} disabled={working}>Cancel</button>
                <button type="submit" className="button button-primary" disabled={working}>
                  {working ? <LoaderCircle className="spin" size={17} /> : dialog.mode === 'edit' ? <><Check size={17} /> Save changes</> : <><Plus size={17} /> Add product</>}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}

      {dialog?.mode === 'delete' ? (
        <div className="modal-backdrop" role="presentation">
          <section className="modal-card delete-modal" role="dialog" aria-modal="true" aria-labelledby="delete-dialog-title">
            <div className="delete-icon"><CircleAlert size={23} /></div>
            <h2 id="delete-dialog-title">Delete this product?</h2>
            <p><strong>{dialog.product.product_name}</strong> will be permanently removed from your catalog. This action cannot be undone.</p>
            {notice && <Notice message={notice} type={noticeType} />}
            <div className="modal-actions">
              <button className="button button-quiet" onClick={() => setDialog(null)} disabled={working}>Cancel</button>
              <button className="button button-danger" onClick={handleDeleteProduct} disabled={working}>
                {working ? <LoaderCircle className="spin" size={17} /> : <><Trash2 size={17} /> Delete product</>}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  )
}

function Notice({ message, type, onDismiss }) {
  return (
    <div className={`notice ${type === 'success' ? 'notice-success' : 'notice-error'}`} role={type === 'error' ? 'alert' : 'status'}>
      {type === 'success' ? <Check size={17} /> : <CircleAlert size={17} />}
      <span>{message}</span>
      {onDismiss && <button className="notice-dismiss" onClick={onDismiss} aria-label="Dismiss message"><X size={16} /></button>}
    </div>
  )
}

export default App
