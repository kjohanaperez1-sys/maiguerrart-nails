// Service descriptions data
var SERVICE_INFO = window.SERVICE_INFO || {
  "Gel Manicure": {
    icon: "💅",
    description: "Chip-free, glossy nails that last up to 3 weeks. No drying time — walk out ready to go.",
    duration: "45-60 min",
    includes: [
      "Cuticle care & shaping",
      "Gel colour application",
      "Glossy top coat",
      "Cuticle oil finish"
    ],
    perfectFor: "Busy lifestyles, work, travel, events."
  },
  "Acrylic Set": {
    icon: "✨",
    description: "Sculptured nails with custom length and shape. Strong, bold, and built to last 3-4 weeks.",
    duration: "75-90 min",
    includes: [
      "Nail prep & primer",
      "Acrylic sculpting",
      "Custom shaping",
      "Colour & gloss finish"
    ],
    perfectFor: "Dramatic length, nail biters, bold art lovers."
  },
  "Dip Powder": {
    icon: "🌸",
    description: "Strong, lightweight nails with a natural feel. No UV lamp needed — just layers of rich colour.",
    duration: "60-75 min",
    includes: [
      "Nail prep",
      "Coloured dip layers",
      "Shape & buff",
      "Top coat seal"
    ],
    perfectFor: "Natural look lovers who want durability."
  },
  "Nail Art": {
    icon: "🎨",
    description: "Hand-painted designs, crystals, chrome, and 3D details. Karen turns your nails into art.",
    duration: "90-120 min",
    includes: [
      "Design consultation",
      "Hand-painted details",
      "Embellishments",
      "Protective seal"
    ],
    perfectFor: "Special occasions, statement looks, Instagram moments."
  },
  "Builder Gel": {
    icon: "🔮",
    description: "A flexible overlay that strengthens natural nails and adds subtle length. Stronger than gel, softer than acrylic.",
    duration: "60-75 min",
    includes: [
      "Nail strengthening",
      "Builder gel overlay",
      "Shape & colour",
      "Cuticle care"
    ],
    perfectFor: "Weak, brittle nails or growing out natural length."
  },
  "Gel Pedicure": {
    icon: "🦶",
    description: "Luxurious foot care with long-lasting gel polish. Soak, scrub, massage — feet feel brand new.",
    duration: "60-75 min",
    includes: [
      "Foot soak & scrub",
      "Callus & cuticle care",
      "Nail shaping",
      "Gel polish & massage"
    ],
    perfectFor: "Sandals season, self-care days, year-round maintenance."
  }
};

// app.js - Maiguerrart Nails Booking System
// ============================================

let selectedService = ''
let selectedPrice = 0
let currentSlide = 0
const totalSlides = 8
let autoPlayTimer = null

const ALL_TIME_SLOTS = [
  '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'
]

// Admin password
const ADMIN_PASSWORD = 'karen2024'

function checkAdminPassword() {
  const password = prompt('Enter admin password:')
  if (password !== ADMIN_PASSWORD) {
    alert('Incorrect password')
    showPage('home')
    return false
  }
  loadAdminDashboard()
  return true
}

// Page navigation
function showPage(page) {
  // Hide all pages
  document.querySelectorAll('.page').forEach(function(p) {
    p.classList.remove('active')
    p.classList.add('hidden')
    p.style.display = 'none'
  })

  // Show selected page
  const selectedPage = document.getElementById('page-' + page)
  if (selectedPage) {
    selectedPage.classList.remove('hidden')
    selectedPage.classList.add('active')
    selectedPage.style.display = 'block'
  }

  // Hero only on home
  const hero = document.querySelector('.hero')
  if (hero) {
    hero.style.display = (page === 'home') ? 'block' : 'none'
  }

  // Header always visible
  const header = document.querySelector('header')
  if (header) header.style.display = 'flex'

  // Page-specific init
  if (page === 'admin') {
    const ok = checkAdminPassword()
    if (!ok) return
  }
  if (page === 'home') {
    loadGallery()
  }
  if (page === 'booking') {
    initCalendar()
    if (typeof checkPaymentReturn === 'function') {
      checkPaymentReturn()
    }
  }

  window.scrollTo(0, 0)
}

function scrollToBooking() {
  showPage('booking')
}

function selectService(el) {
  const isAlreadySelected = el.classList.contains('selected')
  const isAlreadyFlipped = el.classList.contains('flipped')

  // Reset all cards
  document.querySelectorAll('.flip-card').forEach(function(c) {
    c.classList.remove('selected')
    c.classList.remove('flipped')
  })

  // If clicking the same card that's already selected and flipped, just unselect it
  if (isAlreadySelected && isAlreadyFlipped) {
    selectedService = ''
    selectedPrice = 0
    return
  }

  // Select and flip the clicked card
  el.classList.add('selected')
  el.classList.add('flipped')
  selectedService = el.dataset.service
  selectedPrice = parseInt(el.dataset.price)
}

function showServiceDescription(serviceName) {
  // This function is kept for compatibility but no longer used
  // Descriptions are now shown on the flip card back
}

function initCalendar() {
  const dateInput = document.getElementById('f-date')
  if (!dateInput) return

  const today = new Date().toISOString().split('T')[0]
  dateInput.min = today
  dateInput.value = ''

  const timeSelect = document.getElementById('f-time')
  if (timeSelect) {
    timeSelect.innerHTML = '<option value="">Select date first</option>'
    timeSelect.disabled = true
  }
}

async function loadAvailableTimes() {
  const dateInput = document.getElementById('f-date')
  const timeSelect = document.getElementById('f-time')
  const timeHint = document.getElementById('time-hint')

  if (!dateInput || !timeSelect) return

  const selectedDate = dateInput.value
  if (!selectedDate) {
    timeSelect.innerHTML = '<option value="">Select date first</option>'
    timeSelect.disabled = true
    if (timeHint) timeHint.style.opacity = '0'
    return
  }

  const isBlocked = await isDateBlocked(selectedDate)
  if (isBlocked) {
    alert('This date is fully booked or unavailable. Please select another date.')
    dateInput.value = ''
    timeSelect.innerHTML = '<option value="">Select date first</option>'
    timeSelect.disabled = true
    return
  }

  timeSelect.innerHTML = '<option value="">Loading times...</option>'
  timeSelect.disabled = true

  let bookedTimes = []

  if (typeof isSupabaseReady === 'function' && isSupabaseReady()) {
    try {
      const { data, error } = await db
        .from('bookings')
        .select('time')
        .eq('date', selectedDate)
        .not('status', 'eq', 'cancelled')

      if (!error && data) {
        bookedTimes = data.map(function(b) { return b.time })
      }
    } catch (e) {
      console.log('Using demo booked times')
    }
  }

  if (bookedTimes.length === 0 && selectedDate === getDemoDate()) {
    bookedTimes = ['10:00 AM', '2:00 PM']
  }

  timeSelect.innerHTML = '<option value="">Choose a time</option>'

  ALL_TIME_SLOTS.forEach(function(time) {
    const isBooked = bookedTimes.includes(time)
    const option = document.createElement('option')
    option.value = time
    option.textContent = isBooked ? time + ' - Booked' : time
    option.disabled = isBooked
    if (isBooked) {
      option.style.color = '#999'
      option.style.background = '#f5f5f5'
    }
    timeSelect.appendChild(option)
  })

  timeSelect.disabled = false
  if (timeHint) {
    timeHint.textContent = bookedTimes.length > 0
      ? bookedTimes.length + ' time(s) already booked - only available times shown'
      : 'All times available for this date'
    timeHint.style.opacity = '1'
  }
}

function getDemoDate() {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return tomorrow.toISOString().split('T')[0]
}

async function isDateBlocked(date) {
  if (typeof isSupabaseReady === 'function' && isSupabaseReady()) {
    try {
      const { data } = await db.from('blocked_dates').select('date').eq('date', date)
      if (data && data.length > 0) return true
    } catch (e) {}
  }

  const demoBlocked = ['2026-12-25', '2026-12-26', '2027-01-01']
  return demoBlocked.includes(date)
}

function handleDesignUpload(event) {
  const file = event.target.files[0]
  if (!file) return

  const preview = document.getElementById('design-preview')
  const uploadStatus = document.getElementById('upload-status')

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
  const maxSize = 5 * 1024 * 1024

  if (!allowedTypes.includes(file.type)) {
    alert('Please upload JPG, PNG, or WebP images only.')
    event.target.value = ''
    return
  }
  if (file.size > maxSize) {
    alert('File too large. Maximum 5MB.')
    event.target.value = ''
    return
  }

  const reader = new FileReader()
  reader.onload = function(e) {
    if (preview) {
      preview.src = e.target.result
      preview.style.display = 'block'
    }
    if (uploadStatus) {
      uploadStatus.textContent = 'OK: ' + file.name + ' (' + (file.size/1024).toFixed(1) + ' KB)'
      uploadStatus.style.color = '#155724'
    }
  }
  reader.readAsDataURL(file)
  window.designFile = file
}

async function submitBooking() {
  const first = document.getElementById('f-first').value.trim()
  const last = document.getElementById('f-last').value.trim()
  const email = document.getElementById('f-email').value.trim()
  const phone = document.getElementById('f-phone').value.trim()
  const date = document.getElementById('f-date').value
  const time = document.getElementById('f-time').value
  const notes = document.getElementById('f-notes').value.trim()
  const reminderEmail = document.getElementById('reminder-email')
  const reminderSms = document.getElementById('reminder-sms')

  const remEmail = reminderEmail ? reminderEmail.checked : false
  const remSms = reminderSms ? reminderSms.checked : true

  if (!selectedService) {
    alert('Please select a service first')
    return
  }
  if (!first || !last) {
    alert('Please enter your full name')
    return
  }
  if (!email || !email.includes('@')) {
    alert('Please enter a valid email')
    return
  }
  if (!phone) {
    alert('Please enter your phone number')
    return
  }
  if (!date) {
    alert('Please select a date')
    return
  }
  if (!time) {
    alert('Please select a time')
    return
  }

  const isStillAvailable = await checkTimeAvailable(date, time)
  if (!isStillAvailable) {
    alert('Sorry, someone just booked this time. Please select another time.')
    loadAvailableTimes()
    return
  }

  const btn = document.querySelector('.submit-btn')
  btn.disabled = true
  btn.textContent = 'Processing...'

  try {
    let designUrl = null
    if (window.designFile) {
      designUrl = await uploadDesignImage(window.designFile, email)
    }

    const bookingData = {
      first: first,
      last: last,
      email: email,
      phone: phone,
      date: date,
      time: time,
      notes: notes,
      service: selectedService,
      price: selectedPrice,
      design_url: designUrl,
      reminder_email: remEmail,
      reminder_sms: remSms
    }

    // Save to Supabase
    if (typeof dbHelpers !== 'undefined' && isSupabaseReady()) {
      const result = await dbHelpers.saveBooking(bookingData)
      if (result.success) {
        // Show confirmation
        document.getElementById('confirmation').classList.remove('hidden')
        document.getElementById('confirmation-details').innerHTML = 
          '<strong>' + selectedService + '</strong><br>' +
          date + ' at ' + time + '<br>' +
          first + ' ' + last
        window.scrollTo(0, document.body.scrollHeight)

        // Reset form
        setTimeout(() => {
          const form = document.getElementById('bookingForm');
if (form) form.reset();
          selectedService = ''
          selectedPrice = 0
          document.querySelectorAll('.flip-card').forEach(c => {
            c.classList.remove('selected')
            c.classList.remove('flipped')
          })
        }, 3000)
      } else {
        alert('Error saving booking: ' + result.error)
        btn.disabled = false
        btn.textContent = 'Pay $20 Bond & Confirm Appointment'
      }
    } else {
      // Fallback if Supabase not connected
      await requestBookingBond(bookingData)
    }

  } catch (err) {
    console.error('Booking error:', err)
    alert('Something went wrong: ' + err.message)
    btn.disabled = false
    btn.textContent = 'Pay $20 Bond & Confirm Appointment'
  }
}

async function checkTimeAvailable(date, time) {
  if (typeof isSupabaseReady !== 'function' || !isSupabaseReady()) {
    return true
  }

  const { data, error } = await db
    .from('bookings')
    .select('id')
    .eq('date', date)
    .eq('time', time)
    .not('status', 'eq', 'cancelled')

  if (error) return true
  return !data || data.length === 0
}

async function uploadDesignImage(file, userEmail) {
  const fileName = 'designs/' + Date.now() + '_' + userEmail.replace(/[^a-z0-9]/gi, '_') + '.' + file.name.split('.').pop()

  const { data, error } = await db
    .storage
    .from('nail-designs')
    .upload(fileName, file, { cacheControl: '3600', upsert: false })

  if (error) {
    console.error('Upload error:', error)
    return null
  }

  const { data: urlData } = db.storage.from('nail-designs').getPublicUrl(fileName)
  return urlData ? urlData.publicUrl : null
}

async function scheduleReminders(bookingId, bookingData) {
  if (typeof isSupabaseReady === 'function' && isSupabaseReady()) {
    await db.from('bookings').update({
      reminder_email: bookingData.reminder_email,
      reminder_sms: bookingData.reminder_sms
    }).eq('id', bookingId)
  }
  console.log('Reminder scheduled for booking:', bookingId)
}

async function loadAdminDashboard() {
  const list = document.getElementById('bookings-list')
  if (!list) return

  if (typeof isSupabaseReady !== 'function' || !isSupabaseReady()) {
    list.innerHTML = '<div style="text-align:center;padding:3rem;color:#7A5C62"><div style="font-size:48px;margin-bottom:1rem">&#128295;</div><h3 style="color:#9B4D60;margin-bottom:8px">Database Not Connected</h3><p style="font-size:14px;margin-bottom:1rem">Ask your developer to help Mai set up Supabase.<br>Once connected, all bookings will appear here.</p></div>'
    document.getElementById('stat-total').textContent = '0'
    document.getElementById('stat-confirmed').textContent = '0'
    document.getElementById('stat-pending').textContent = '0'
    return
  }

  list.innerHTML = '<p style="color:#7A5C62;text-align:center;padding:2rem">Loading bookings...</p>'

  try {
    const { data, error } = await db
      .from('bookings')
      .select('id, service, date, time, notes, price, status, bond_paid, design_url, reminder_email, reminder_sms, created_at, updated_at, clients(name, email, phone)')
      .order('date', { ascending: true })

    if (error) {
      list.innerHTML = '<p style="color:red;text-align:center;padding:2rem">Error loading bookings.</p>'
      console.error(error)
      return
    }

    if (!data || !data.length) {
      list.innerHTML = '<p style="color:#7A5C62;text-align:center;padding:2rem">No bookings yet!</p>'
      document.getElementById('stat-total').textContent = '0'
      document.getElementById('stat-confirmed').textContent = '0'
      document.getElementById('stat-pending').textContent = '0'
      return
    }

    const confirmed = data.filter(function(b) { return b.status === 'confirmed' }).length
    const pending = data.filter(function(b) { return b.status === 'pending' || b.status === 'pending_payment' }).length

    document.getElementById('stat-total').textContent = data.length
    document.getElementById('stat-confirmed').textContent = confirmed
    document.getElementById('stat-pending').textContent = pending

    // Build table using DOM to avoid quote issues
    const container = document.createElement('div')
    container.style.overflowX = 'auto'

    const table = document.createElement('table')
    table.style.width = '100%'
    table.style.borderCollapse = 'collapse'
    table.style.fontSize = '13px'

    // Header
    const thead = document.createElement('thead')
    const headerRow = document.createElement('tr')
    headerRow.style.background = '#FDE8EE'
    headerRow.style.color = '#9B4D60'

    const headers = ['Client', 'Service', 'Date', 'Time', 'Contact', 'Bond', 'Status', 'Action']
    headers.forEach(function(text) {
      const th = document.createElement('th')
      th.style.padding = '10px'
      th.style.textAlign = 'left'
      th.style.borderBottom = '2px solid #F5C6C6'
      th.textContent = text
      headerRow.appendChild(th)
    })
    thead.appendChild(headerRow)
    table.appendChild(thead)

    // Body
    const tbody = document.createElement('tbody')
    data.forEach(function(b) {
      const row = document.createElement('tr')
      row.style.borderBottom = '1px solid #F5C6C6'
      if (b.status === 'cancelled') row.style.opacity = '0.6'

      // Client name
      const tdName = document.createElement('td')
      tdName.style.padding = '10px'
      tdName.style.fontWeight = '500'
      tdName.textContent = b.clients ? b.clients.name : 'N/A'
      row.appendChild(tdName)

      // Service
      const tdService = document.createElement('td')
      tdService.style.padding = '10px'
      tdService.style.color = '#7A5C62'
      tdService.textContent = b.service
      row.appendChild(tdService)

      // Date
      const tdDate = document.createElement('td')
      tdDate.style.padding = '10px'
      tdDate.style.color = '#7A5C62'
      tdDate.textContent = b.date
      row.appendChild(tdDate)

      // Time
      const tdTime = document.createElement('td')
      tdTime.style.padding = '10px'
      tdTime.style.color = '#7A5C62'
      tdTime.textContent = b.time
      row.appendChild(tdTime)

      // Contact
      const tdContact = document.createElement('td')
      tdContact.style.padding = '10px'
      tdContact.style.color = '#7A5C62'
      tdContact.style.fontSize = '12px'
      tdContact.innerHTML = (b.clients ? b.clients.email : '') + '<br>' + (b.clients ? b.clients.phone : '')
      row.appendChild(tdContact)

      // Bond
      const tdBond = document.createElement('td')
      tdBond.style.padding = '10px'
      const bondSpan = document.createElement('span')
      bondSpan.style.padding = '3px 10px'
      bondSpan.style.borderRadius = '100px'
      bondSpan.style.fontSize = '11px'
      bondSpan.style.fontWeight = '500'
      bondSpan.style.background = b.bond_paid ? '#D4EDDA' : '#FFF3CD'
      bondSpan.style.color = b.bond_paid ? '#155724' : '#856404'
      bondSpan.textContent = b.bond_paid ? 'Paid' : 'Pending'
      tdBond.appendChild(bondSpan)
      row.appendChild(tdBond)

      // Status
      const tdStatus = document.createElement('td')
      tdStatus.style.padding = '10px'
      const statusSpan = document.createElement('span')
      statusSpan.style.padding = '3px 10px'
      statusSpan.style.borderRadius = '100px'
      statusSpan.style.fontSize = '11px'
      statusSpan.style.fontWeight = '500'
      statusSpan.style.background = b.status === 'confirmed' ? '#D4EDDA' : b.status === 'cancelled' ? '#F8D7DA' : '#FFF3CD'
      statusSpan.style.color = b.status === 'confirmed' ? '#155724' : b.status === 'cancelled' ? '#721C24' : '#856404'
      statusSpan.textContent = b.status
      tdStatus.appendChild(statusSpan)
      row.appendChild(tdStatus)

      // Action
      const tdAction = document.createElement('td')
      tdAction.style.padding = '10px'
      const select = document.createElement('select')
      select.style.padding = '4px 8px'
      select.style.border = '1px solid #F5C6C6'
      select.style.borderRadius = '6px'
      select.style.fontSize = '12px'
      select.style.cursor = 'pointer'
      select.onchange = function() { updateStatus(b.id, this.value) }

      const options = [
        { value: 'pending', label: 'Pending', selected: b.status === 'pending' },
        { value: 'confirmed', label: 'Confirm', selected: b.status === 'confirmed' },
        { value: 'completed', label: 'Completed', selected: b.status === 'completed' },
        { value: 'cancelled', label: 'Cancel', selected: b.status === 'cancelled' }
      ]

      options.forEach(function(opt) {
        const option = document.createElement('option')
        option.value = opt.value
        option.textContent = opt.label
        if (opt.selected) option.selected = true
        select.appendChild(option)
      })

      tdAction.appendChild(select)
      row.appendChild(tdAction)

      tbody.appendChild(row)
    })

    table.appendChild(tbody)
    container.appendChild(table)
    list.innerHTML = ''
    list.appendChild(container)

  } catch (err) {
    list.innerHTML = '<p style="color:red;text-align:center;padding:2rem">Failed to load data.</p>'
    console.error(err)
  }
}

async function updateStatus(bookingId, newStatus) {
  if (typeof isSupabaseReady !== 'function' || !isSupabaseReady()) {
    alert('Database not connected. Cannot update status in demo mode.')
    return
  }

  const { error } = await db.from('bookings').update({
    status: newStatus,
    updated_at: new Date().toISOString()
  }).eq('id', bookingId)

  if (error) {
    alert('Could not update status.')
    console.error(error)
    return
  }
  loadAdminDashboard()
}

async function exportToExcel() {
  if (typeof isSupabaseReady !== 'function' || !isSupabaseReady()) {
    alert('Database not connected. Cannot export in demo mode.')
    return
  }

  const { data, error } = await db
    .from('bookings')
    .select('id, service, date, time, notes, price, status, bond_paid, created_at, clients(name, email, phone)')
    .order('date', { ascending: true })

  if (error || !data || !data.length) {
    alert('No bookings to export yet!')
    return
  }

  const rows = data.map(function(b) {
    return {
      'Client Name': b.clients ? b.clients.name : '',
      'Email': b.clients ? b.clients.email : '',
      'Phone': b.clients ? b.clients.phone : '',
      'Service': b.service,
      'Date': b.date,
      'Time': b.time,
      'Price': b.price ? '$' + b.price : '',
      'Bond Paid': b.bond_paid ? 'Yes' : 'No',
      'Notes': b.notes || '',
      'Status': b.status,
      'Created': b.created_at ? new Date(b.created_at).toLocaleString() : ''
    }
  })

  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Bookings')
  XLSX.writeFile(wb, 'maiguerrart-bookings-' + new Date().toISOString().split('T')[0] + '.xlsx')
}

async function searchBooking() {
  const search = document.getElementById('manage-search').value.trim()
  const results = document.getElementById('manage-results')

  if (!search) {
    results.innerHTML = '<p style="color:#D4758A;font-size:13px">Please enter your name, email or phone.</p>'
    return
  }

  if (typeof isSupabaseReady !== 'function' || !isSupabaseReady()) {
    results.innerHTML = '<div style="text-align:center;padding:2rem;color:#7A5C62"><div style="font-size:32px;margin-bottom:8px">&#128295;</div><p style="font-size:13px">Database not connected yet. This feature will work once Supabase is set up.</p></div>'
    return
  }

  results.innerHTML = '<p style="color:#7A5C62;font-size:13px;text-align:center">Searching...</p>'

  try {
    const { data: clients, error } = await db
      .from('clients')
      .select('id, name, email, phone, bookings(id, service, date, time, status, bond_paid, design_url)')
      .or('name.ilike.%' + search + '%,email.ilike.%' + search + '%,phone.ilike.%' + search + '%')

    if (error || !clients || !clients.length) {
      results.innerHTML = '<p style="color:#7A5C62;font-size:13px;text-align:center;padding:1rem">No booking found. Please check your details and try again.</p>'
      return
    }

    let allBookings = []
    clients.forEach(function(c) {
      if (c.bookings) {
        c.bookings.forEach(function(b) {
          allBookings.push({
            id: b.id,
            service: b.service,
            date: b.date,
            time: b.time,
            status: b.status,
            bond_paid: b.bond_paid,
            design_url: b.design_url,
            clientName: c.name,
            clientEmail: c.email,
            clientPhone: c.phone
          })
        })
      }
    })

    allBookings = allBookings.filter(function(b) { return b.status !== 'cancelled' })

    if (!allBookings.length) {
      results.innerHTML = '<p style="color:#7A5C62;font-size:13px;text-align:center;padding:1rem">No active bookings found.</p>'
      return
    }

    // Build results using DOM to avoid quote issues
    results.innerHTML = ''
    allBookings.forEach(function(b) {
      const card = document.createElement('div')
      card.style.border = '1px solid #F5C6C6'
      card.style.borderRadius = '10px'
      card.style.padding = '1rem'
      card.style.marginBottom = '8px'
      card.style.background = '#FDF8F4'

      // Service name
      const serviceName = document.createElement('div')
      serviceName.style.fontSize = '14px'
      serviceName.style.fontWeight = '600'
      serviceName.style.color = '#2C1A1D'
      serviceName.style.marginBottom = '4px'
      serviceName.textContent = b.service
      card.appendChild(serviceName)

      // Date/time and client
      const info = document.createElement('div')
      info.style.fontSize = '13px'
      info.style.color = '#7A5C62'
      info.style.marginBottom = '8px'
      info.innerHTML = '&#128197; ' + b.date + ' at ' + b.time + '<br>&#128100; ' + b.clientName
      if (b.design_url) {
        info.innerHTML += '<br>&#128206; <a href="' + b.design_url + '" target="_blank" style="color:#D4758A">View Design</a>'
      }
      card.appendChild(info)

      // Status and bond
      const statusRow = document.createElement('div')
      statusRow.style.fontSize = '12px'
      statusRow.style.marginBottom = '8px'

      const statusSpan = document.createElement('span')
      statusSpan.style.padding = '3px 10px'
      statusSpan.style.borderRadius = '100px'
      statusSpan.style.fontSize = '11px'
      statusSpan.style.fontWeight = '500'
      statusSpan.style.background = b.status === 'confirmed' ? '#D4EDDA' : '#FFF3CD'
      statusSpan.style.color = b.status === 'confirmed' ? '#155724' : '#856404'
      statusSpan.textContent = b.status
      statusRow.appendChild(statusSpan)

      if (b.bond_paid) {
        const bondSpan = document.createElement('span')
        bondSpan.style.padding = '3px 10px'
        bondSpan.style.borderRadius = '100px'
        bondSpan.style.fontSize = '11px'
        bondSpan.style.fontWeight = '500'
        bondSpan.style.background = '#D4EDDA'
        bondSpan.style.color = '#155724'
        bondSpan.style.marginLeft = '6px'
        bondSpan.textContent = 'Bond Paid'
        statusRow.appendChild(bondSpan)
      }
      card.appendChild(statusRow)

      // Buttons
      const btnRow = document.createElement('div')
      btnRow.style.display = 'flex'
      btnRow.style.gap = '8px'
      btnRow.style.flexWrap = 'wrap'

      const rescheduleBtn = document.createElement('button')
      rescheduleBtn.textContent = 'Reschedule'
      rescheduleBtn.style.background = '#D4758A'
      rescheduleBtn.style.color = 'white'
      rescheduleBtn.style.border = 'none'
      rescheduleBtn.style.padding = '7px 14px'
      rescheduleBtn.style.borderRadius = '6px'
      rescheduleBtn.style.cursor = 'pointer'
      rescheduleBtn.style.fontSize = '12px'
      rescheduleBtn.style.fontWeight = '500'
      rescheduleBtn.onclick = function() { rescheduleBooking(b.id) }
      btnRow.appendChild(rescheduleBtn)

      const cancelBtn = document.createElement('button')
      cancelBtn.textContent = 'Cancel'
      cancelBtn.style.background = 'white'
      cancelBtn.style.color = '#D4758A'
      cancelBtn.style.border = '1px solid #D4758A'
      cancelBtn.style.padding = '7px 14px'
      cancelBtn.style.borderRadius = '6px'
      cancelBtn.style.cursor = 'pointer'
      cancelBtn.style.fontSize = '12px'
      cancelBtn.style.fontWeight = '500'
      cancelBtn.onclick = function() { cancelBooking(b.id, b.date, b.clientName) }
      btnRow.appendChild(cancelBtn)

      card.appendChild(btnRow)
      results.appendChild(card)
    })

  } catch (err) {
    results.innerHTML = '<p style="color:red;font-size:13px;text-align:center">Search failed. Please try again.</p>'
    console.error(err)
  }
}

async function cancelBooking(bookingId, date, clientName) {
  const bookingDate = new Date(date + 'T00:00:00')
  const now = new Date()
  const hoursUntil = (bookingDate - now) / (1000 * 60 * 60)

  let message = 'Are you sure you want to cancel this booking, ' + clientName + '?'
  if (hoursUntil < 48 && hoursUntil > 0) {
    message += '\n\nThis is within 48 hours. The $20 bond will NOT be refunded.'
  } else if (hoursUntil >= 48) {
    message += '\n\nThis is 48+ hours before. Your $20 bond will be refunded within 3-5 business days.'
  }

  if (!confirm(message)) return

  if (typeof isSupabaseReady !== 'function' || !isSupabaseReady()) {
    alert('Demo mode: Cancellation would work once database is connected.')
    return
  }

  try {
    const { error } = await db.from('bookings').update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      refund_eligible: hoursUntil >= 48
    }).eq('id', bookingId)

    if (error) throw error

    alert(hoursUntil >= 48
      ? 'Booking cancelled. Your $20 refund will be processed within 3-5 business days.'
      : 'Booking cancelled. As per our policy, the bond is non-refundable for late cancellations.')

    searchBooking()
  } catch (err) {
    alert('Could not cancel booking. Please contact us directly.')
    console.error(err)
  }
}

async function rescheduleBooking(bookingId) {
  const newDate = prompt('Enter new date (YYYY-MM-DD):')
  if (!newDate) return

  if (newDate < new Date().toISOString().split('T')[0]) {
    alert('Cannot reschedule to a past date.')
    return
  }

  const newTime = prompt('Enter new time (e.g. 10:00 AM):')
  if (!newTime) return

  if (typeof isSupabaseReady !== 'function' || !isSupabaseReady()) {
    alert('Demo mode: Rescheduling would work once database is connected.')
    return
  }

  try {
    const { error } = await db.from('bookings').update({
      date: newDate,
      time: newTime,
      status: 'pending',
      rescheduled: true,
      updated_at: new Date().toISOString()
    }).eq('id', bookingId)

    if (error) throw error

    alert('Booking rescheduled successfully!\n\nNew time: ' + newDate + ' at ' + newTime)
    searchBooking()
  } catch (err) {
    alert('Could not reschedule. Please contact us directly.')
    console.error(err)
  }
}

// Carousel
function moveCarousel(direction) {
  currentSlide += direction
  if (currentSlide < 0) currentSlide = totalSlides - 1
  if (currentSlide >= totalSlides) currentSlide = 0
  updateCarousel()
  resetAutoPlay()
}

function goToSlide(index) {
  currentSlide = index
  updateCarousel()
  resetAutoPlay()
}

function updateCarousel() {
  const track = document.getElementById('carousel-track')
  const counter = document.getElementById('carousel-counter')
  if (!track) return

  track.style.transform = 'translateX(-' + (currentSlide * 100) + '%)'

  if (counter) counter.textContent = (currentSlide + 1) + ' / ' + totalSlides

  document.querySelectorAll('.dot').forEach(function(dot, i) {
    dot.classList.toggle('active', i === currentSlide)
  })
}

function initCarousel() {
  currentSlide = 0
  const dotsContainer = document.getElementById('carousel-dots')
  if (!dotsContainer) return

  dotsContainer.innerHTML = ''
  for (let i = 0; i < totalSlides; i++) {
    const dot = document.createElement('div')
    dot.className = 'dot' + (i === 0 ? ' active' : '')
    dot.onclick = function() { goToSlide(i) }
    dotsContainer.appendChild(dot)
  }
  updateCarousel()
  startAutoPlay()
}

function startAutoPlay() {
  if (autoPlayTimer) clearInterval(autoPlayTimer)
  autoPlayTimer = setInterval(function() { moveCarousel(1) }, 5000)
}

function resetAutoPlay() {
  startAutoPlay()
}

function loadGallery() {
  initCarousel()
  if (window.instgrm) window.instgrm.Embeds.process()
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
  showPage('home')
  console.log('Maiguerrart Nails ready - Demo mode active')
})