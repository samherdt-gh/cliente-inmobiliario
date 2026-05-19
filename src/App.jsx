import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import './App.css'

const supabaseUrl = 'https://kbwihyhqiwcsoscgrsmx.supabase.co'
const supabaseKey = 'sb_publishable_1eY8BaKJp87W5evy9fw_9Q_hQ5jKru9'

const supabase = createClient(supabaseUrl, supabaseKey)

function App() {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [view, setView] = useState('list')
  const [search, setSearch] = useState('')
  const [editingClient, setEditingClient] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    interest: 'compra',
    property_type: '',
    budget: '',
    source: 'web',
    notes: '',
    status: 'nuevo'
  })

  useEffect(() => {
    fetchClients()
  }, [])

  async function fetchClients() {
    setLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching:', error)
      setError(error.message)
    } else {
      setClients(data || [])
    }
    setLoading(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    
    const clientData = {
      name: formData.name,
      phone: formData.phone,
      email: formData.email || null,
      interest: formData.interest,
      property_type: formData.property_type || null,
      budget: formData.budget || null,
      source: formData.source,
      notes: formData.notes || null,
      status: formData.status || 'nuevo'
    }

    if (editingClient) {
      const { error } = await supabase
        .from('clients')
        .update({ ...clientData, updated_at: new Date().toISOString() })
        .eq('id', editingClient.id)
      
      if (error) {
        setError(error.message)
        return
      }
    } else {
      const { error } = await supabase
        .from('clients')
        .insert([clientData])
      
      if (error) {
        setError(error.message)
        return
      }
    }
    
    setFormData({
      name: '',
      phone: '',
      email: '',
      interest: 'compra',
      property_type: '',
      budget: '',
      source: 'web',
      notes: '',
      status: 'nuevo'
    })
    setEditingClient(null)
    setView('list')
    fetchClients()
  }

  async function deleteClient(id) {
    if (confirm('¿Eliminar cliente?')) {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id)
      
      if (!error) {
        fetchClients()
      }
    }
  }

  function editClient(client) {
    setEditingClient(client)
    setFormData({
      name: client.name,
      phone: client.phone,
      email: client.email || '',
      interest: client.interest || 'compra',
      property_type: client.property_type || '',
      budget: client.budget || '',
      source: client.source || 'web',
      notes: client.notes || '',
      status: client.status || 'nuevo'
    })
    setView('add')
  }

  function getInitials(name) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2)
  }

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search) ||
    (c.email && c.email.toLowerCase().includes(search.toLowerCase()))
  )

  const stats = {
    total: clients.length,
    compra: clients.filter(c => c.interest === 'compra').length,
    venta: clients.filter(c => c.interest === 'venta').length,
    tasacion: clients.filter(c => c.interest === 'tasacion').length
  }

  const interestLabels = {
    compra: 'Compra',
    venta: 'Venta',
    tasacion: 'Tasación'
  }

  if (loading) {
    return (
      <div className="app">
        <div className="loading">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="app">
      <div className="header">
        <div className="header-content">
          <h1>Lautaro Ferradas</h1>
          <p className="subtitle">Corredor Inmobiliario</p>
          <div className="stats">
            <div className="stat">
              <span className="stat-value">{stats.total}</span>
              <span className="stat-label">Clientes</span>
            </div>
            <div className="stat">
              <span className="stat-value">{stats.compra}</span>
              <span className="stat-label">Compra</span>
            </div>
            <div className="stat">
              <span className="stat-value">{stats.venta}</span>
              <span className="stat-label">Venta</span>
            </div>
            <div className="stat">
              <span className="stat-value">{stats.tasacion}</span>
              <span className="stat-label">Tasación</span>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div style={{background: '#fee2e2', color: '#dc2626', padding: '12px', borderRadius: '8px', marginBottom: '16px'}}>
          Error: {error}
        </div>
      )}

      <div className="tabs">
        <button 
          className={`tab ${view === 'list' ? 'active' : ''}`}
          onClick={() => setView('list')}
        >
          Clientes ({clients.length})
        </button>
        <button 
          className={`tab ${view === 'add' ? 'active' : ''}`}
          onClick={() => { setView('add'); setEditingClient(null); setFormData({
            name: '',
            phone: '',
            email: '',
            interest: 'compra',
            property_type: '',
            budget: '',
            source: 'web',
            notes: '',
            status: 'nuevo'
          })}}
        >
          Nuevo Cliente
        </button>
      </div>

      {view === 'list' && (
        <>
          <div className="search-bar">
            <input 
              type="text" 
              placeholder="Buscar por nombre, teléfono o email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="client-list">
            {filteredClients.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">👥</div>
                <div className="empty-title">{search ? 'Sin resultados' : 'No hay clientes aún'}</div>
                <div className="empty-text">{search ? 'Probá con otros términos' : 'Agregá tu primer cliente'}</div>
              </div>
            ) : (
              filteredClients.map(client => (
                <div key={client.id} className="client-card">
                  <div style={{display: 'flex', alignItems: 'flex-start'}}>
                    <div className="client-avatar">
                      {getInitials(client.name)}
                    </div>
                    <div className="client-info">
                      <h3>{client.name}</h3>
                      <p className="client-contact">{client.phone} {client.email && `• ${client.email}`}</p>
                      <div className="client-meta">
                        <span className={`tag ${client.interest}`}>
                          {interestLabels[client.interest] || client.interest}
                        </span>
                        {client.property_type && <span className="tag">{client.property_type}</span>}
                        {client.budget && <span className="tag">💰 {client.budget}</span>}
                      </div>
                      {client.notes && <p style={{marginTop: 12, fontSize: 13, color: '#6b7280'}}>{client.notes}</p>}
                    </div>
                  </div>
                  <div className="client-actions">
                    <button className="btn btn-sm btn-edit" onClick={() => editClient(client)}>✏️ Editar</button>
                    <button className="btn btn-sm btn-delete" onClick={() => deleteClient(client.id)}>🗑️</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {view === 'add' && (
        <div className="form-card">
          <div className="form-header">
            <div className="form-icon">👤</div>
            <div>
              <h2 className="form-title">{editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}</h2>
              <p className="form-subtitle">{editingClient ? 'Actualizá los datos del cliente' : 'Agregá un nuevo contacto'}</p>
            </div>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label>Nombre completo *</label>
                <input 
                  type="text" 
                  required
                  placeholder="Juan Pérez"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Teléfono *</label>
                <input 
                  type="tel" 
                  required
                  placeholder="+54 9 11 1234 5678"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input 
                  type="email" 
                  placeholder="juan@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Interés</label>
                <select 
                  value={formData.interest}
                  onChange={(e) => setFormData({...formData, interest: e.target.value})}
                >
                  <option value="compra">🔍 Compra</option>
                  <option value="venta">💵 Venta</option>
                  <option value="tasacion">📊 Tasación</option>
                </select>
              </div>
              <div className="form-group">
                <label>Tipo de propiedad</label>
                <select 
                  value={formData.property_type}
                  onChange={(e) => setFormData({...formData, property_type: e.target.value})}
                >
                  <option value="">Seleccionar...</option>
                  <option value="departamento">🏢 Departamento</option>
                  <option value="casa">🏠 Casa</option>
                  <option value="terreno">🌱 Terreno</option>
                  <option value="local">🏪 Local</option>
                  <option value="oficina">🏢 Oficina</option>
                  <option value="otro">📌 Otro</option>
                </select>
              </div>
              <div className="form-group">
                <label>Presupuesto</label>
                <input 
                  type="text" 
                  placeholder="$200.000 - $300.000"
                  value={formData.budget}
                  onChange={(e) => setFormData({...formData, budget: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Origen</label>
                <select 
                  value={formData.source}
                  onChange={(e) => setFormData({...formData, source: e.target.value})}
                >
                  <option value="web">🌐 Web</option>
                  <option value="referido">🤝 Referido</option>
                  <option value="llamada">📞 Llamada</option>
                  <option value="whatsapp">💬 WhatsApp</option>
                  <option value="instagram">📸 Instagram</option>
                  <option value="otro">📌 Otro</option>
                </select>
              </div>
              <div className="form-group">
                <label>Estado</label>
                <select 
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                >
                  <option value="nuevo">🆕 Nuevo</option>
                  <option value="contactado">✅ Contactado</option>
                  <option value="seguimiento">⏰ Seguimiento</option>
                  <option value="cerrado">🎉 Cerrado</option>
                </select>
              </div>
              <div className="form-group full-width">
                <label>Notas</label>
                <textarea 
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="Notas adicionales sobre el cliente..."
                />
              </div>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                {editingClient ? '✓ Guardar Cambios' : '+ Agregar Cliente'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setView('list')}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

export default App