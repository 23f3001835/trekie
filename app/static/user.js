// ─────────────────────────────────────────────
//  USER (TREKKER) DASHBOARD
// ─────────────────────────────────────────────

const UserDashboard = {
  template: `
  <div style="min-height:100vh;background:#fff">

    <!-- SIDEBAR -->
    <aside class="side-nav">
      <div class="mb-3">
        <h5 class="mb-0">Trekie</h5>
        <small class="text-muted">Trekker</small>
      </div>

      <nav class="nav nav-pills flex-column">
        <a class="nav-link" href="#" :class="{active: view==='dashboard'}"  @click.prevent="switchView('dashboard')">Dashboard</a>
        <a class="nav-link" href="#" :class="{active: view==='browse'}"     @click.prevent="switchView('browse')">Browse Treks</a>
        <a class="nav-link" href="#" :class="{active: view==='mybookings'}" @click.prevent="switchView('mybookings')">My Bookings</a>
        <a class="nav-link" href="#" :class="{active: view==='history'}"    @click.prevent="switchView('history')">History</a>
        <a class="nav-link" href="#" :class="{active: view==='profile'}"    @click.prevent="switchView('profile')">Profile</a>
      </nav>

      <hr>
      <a class="nav-link text-danger" href="#" @click.prevent="logout">Logout</a>
    </aside>

    <!-- MAIN -->
    <div class="side-main">

      <!-- TOPBAR -->
      <div class="d-flex justify-content-between align-items-center border-bottom px-4 py-3">
        <h5 class="mb-0">{{ viewTitles[view] }}</h5>
        <span>{{ userName }} (Trekker)</span>
      </div>

      <!-- PAGE CONTENT -->
      <div class="p-4">

        <!-- DASHBOARD -->
        <div v-if="view==='dashboard'">
          <h4 class="mb-3">Welcome, {{ userName }}!</h4>

          <h6>Available Treks</h6>
          <div class="row g-3 mb-4">
            <div v-if="!dashTreks.length" class="col-12">
              <div class="border text-center text-muted py-4">No open treks available right now</div>
            </div>
            <div class="col-md-4" v-for="t in dashTreks" :key="t.id">
              <div class="card h-100">
                <div class="bg-light" style="height:140px;background-size:cover;background-position:center"
                     :style="t.image_url ? 'background-image:url('+t.image_url+')' : ''"></div>
                <div class="card-body">
                  <h6 class="card-title">{{ t.name }}</h6>
                  <div class="text-muted">{{ t.location }} | {{ t.duration_days }} Days</div>
                  <div class="mb-2">
                    <span class="badge" :class="'badge-'+t.difficulty.toLowerCase()">{{ t.difficulty }}</span>
                    <span class="ms-2" :class="t.available_slots===0 ? 'text-danger' : 'text-success'">
                      {{ t.available_slots === 0 ? 'Fully Booked' : 'Slots Left: ' + t.available_slots }}
                    </span>
                  </div>
                  <button
                    class="btn btn-primary w-100"
                    :disabled="t.available_slots===0 || t.status!=='Open'"
                    @click="openBookConfirm(t)">
                    {{ t.available_slots===0 || t.status!=='Open' ? 'Not Available' : 'Book Now' }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div class="d-flex justify-content-between align-items-center">
            <h6 class="mb-0">My Bookings</h6>
            <a href="#" @click.prevent="switchView('mybookings')">View All Bookings</a>
          </div>
          <table class="table table-bordered table-hover mt-2">
            <thead>
              <tr><th>Trek Name</th><th>Booking Date</th><th>Start Date</th><th>Status</th></tr>
            </thead>
            <tbody>
              <tr v-if="!myBookings.length"><td colspan="4" class="text-center text-muted py-4">No bookings yet</td></tr>
              <tr v-for="b in myBookings.slice(0,5)" :key="b.id">
                <td>{{ b.trek_name ?? '—' }}</td>
                <td>{{ formatDate(b.booking_date) }}</td>
                <td>{{ b.start_date ? formatDate(b.start_date) : '—' }}</td>
                <td><span class="badge" :class="'badge-'+(b.status||'').toLowerCase()">{{ b.status }}</span></td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- BROWSE TREKS -->
        <div v-if="view==='browse'">
          <div class="d-flex gap-2 flex-wrap mb-3">
            <input class="form-control" style="max-width:260px" placeholder="Search treks..." v-model="filters.search" @input="loadBrowse"/>
            <select class="form-select" style="max-width:200px" v-model="filters.difficulty" @change="loadBrowse">
              <option value="">All Difficulties</option>
              <option>Easy</option><option>Moderate</option><option>Hard</option>
            </select>
            <select class="form-select" style="max-width:220px" v-model="filters.sort" @change="loadBrowse">
              <option value="">Sort by Duration</option>
              <option value="asc">Duration: Low to High</option>
              <option value="desc">Duration: High to Low</option>
            </select>
          </div>

          <div class="row g-3">
            <div v-if="!browsetreks.length" class="col-12">
              <div class="border text-center text-muted py-4">No treks found</div>
            </div>
            <div class="col-md-4" v-for="t in browsetreks" :key="t.id">
              <div class="card h-100">
                <div class="bg-light" style="height:140px;background-size:cover;background-position:center"
                     :style="t.image_url ? 'background-image:url('+t.image_url+')' : ''"></div>
                <div class="card-body">
                  <h6 class="card-title">{{ t.name }}</h6>
                  <div class="text-muted">{{ t.location }} | {{ t.duration_days }} Days</div>
                  <div class="mb-2">
                    <span class="badge" :class="'badge-'+t.difficulty.toLowerCase()">{{ t.difficulty }}</span>
                    <span class="ms-2" :class="t.available_slots===0 ? 'text-danger' : 'text-success'">
                      {{ t.available_slots === 0 ? 'Fully Booked' : 'Slots Left: ' + t.available_slots }}
                    </span>
                  </div>
                  <button class="btn btn-outline-primary w-100" @click="openTrekDetail(t)">View Details</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- MY BOOKINGS -->
        <div v-if="view==='mybookings'">
          <table class="table table-bordered table-hover">
            <thead>
              <tr><th>Trek Name</th><th>Booking Date</th><th>Start Date</th><th>Duration</th><th>Status</th><th>Action</th></tr>
            </thead>
            <tbody>
              <tr v-if="!myBookings.length"><td colspan="6" class="text-center text-muted py-4">No bookings yet</td></tr>
              <tr v-for="b in myBookings" :key="b.id">
                <td>{{ b.trek_name ?? '—' }}</td>
                <td>{{ formatDate(b.booking_date) }}</td>
                <td>{{ b.start_date ? formatDate(b.start_date) : '—' }}</td>
                <td>{{ b.duration_days ?? '—' }} days</td>
                <td><span class="badge" :class="'badge-'+(b.status||'').toLowerCase()">{{ b.status }}</span></td>
                <td>
                  <button class="btn btn-sm btn-outline-primary me-1" @click="viewBookedTrek(b)">View</button>
                  <button v-if="b.status==='Booked'" class="btn btn-sm btn-outline-danger" @click="openCancelConfirm(b)">Cancel</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- HISTORY -->
        <div v-if="view==='history'">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <h6 class="mb-0">Trekking History</h6>
            <button class="btn btn-primary" @click="exportCSV">Export CSV</button>
          </div>
          <div v-if="csvMsg" class="alert alert-info py-2">{{ csvMsg }}</div>
          <table class="table table-bordered table-hover">
            <thead>
              <tr><th>Trek Name</th><th>Start Date</th><th>Duration</th><th>Status</th></tr>
            </thead>
            <tbody>
              <tr v-if="!history.length"><td colspan="4" class="text-center text-muted py-4">No history yet</td></tr>
              <tr v-for="b in history" :key="b.id">
                <td>{{ b.trek_name ?? '—' }}</td>
                <td>{{ formatDate(b.start_date) }}</td>
                <td>{{ b.duration_days ?? '—' }} days</td>

                <td><span class="badge" :class="'badge-'+(b.status||'').toLowerCase()">{{ b.status }}</span></td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- PROFILE -->
        <div v-if="view==='profile'">
          <div class="card" style="max-width:480px">
            <div class="card-header d-flex justify-content-between align-items-center">
              <span class="fw-bold">My Profile</span>
              <button class="btn btn-sm btn-outline-primary" v-if="!editingProfile" @click="startEditProfile">Edit</button>
            </div>
            <div class="card-body">
              <div v-if="!editingProfile">
                <div class="d-flex justify-content-between border-bottom py-2">
                  <span class="text-muted">Name</span><span>{{ profile.name ?? '—' }}</span>
                </div>
                <div class="d-flex justify-content-between border-bottom py-2">
                  <span class="text-muted">Email</span><span>{{ profile.email ?? '—' }}</span>
                </div>
                <div class="d-flex justify-content-between py-2">
                  <span class="text-muted">Phone</span><span>{{ profile.phone ?? '—' }}</span>
                </div>
              </div>
              <div v-else>
                <div class="mb-3">
                  <label class="form-label">Name</label>
                  <input class="form-control" v-model="profileForm.name"/>
                </div>
                <div class="mb-3">
                  <label class="form-label">Email</label>
                  <input class="form-control" :value="profile.email" disabled/>
                </div>
                <div class="mb-3">
                  <label class="form-label">Phone</label>
                  <input class="form-control" v-model="profileForm.phone" maxlength="10"/>
                </div>
                <div v-if="profileErr" class="text-danger mb-3">{{ profileErr }}</div>
                <button class="btn btn-primary me-2" :disabled="savingProfile" @click="saveProfile">{{ savingProfile ? 'Saving...' : 'Save' }}</button>
                <button class="btn btn-secondary" @click="editingProfile=false">Cancel</button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- TREK DETAIL MODAL -->
    <div class="modal fade" id="trekDetailModal" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content" v-if="selectedTrek">
          <div class="modal-header">
            <h5 class="modal-title">{{ selectedTrek.name }}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <div v-if="selectedTrek.image_url" class="mb-3"
                 style="width:100%;height:200px;background-size:cover;background-position:center"
                 :style="'background-image:url('+selectedTrek.image_url+')'"></div>
            <div class="row">
              <div class="col-6"><div class="d-flex justify-content-between border-bottom py-2"><span class="text-muted">Location</span><span>{{ selectedTrek.location }}</span></div></div>
              <div class="col-6"><div class="d-flex justify-content-between border-bottom py-2"><span class="text-muted">Difficulty</span><span>{{ selectedTrek.difficulty }}</span></div></div>
              <div class="col-6"><div class="d-flex justify-content-between border-bottom py-2"><span class="text-muted">Duration</span><span>{{ selectedTrek.duration_days }} Days</span></div></div>
              <div class="col-6"><div class="d-flex justify-content-between border-bottom py-2"><span class="text-muted">Start Date</span><span>{{ formatDate(selectedTrek.start_date) }}</span></div></div>
              <div class="col-6"><div class="d-flex justify-content-between border-bottom py-2"><span class="text-muted">Trek Guide</span><span>{{ selectedTrek.assigned_staff_name || 'Not Assigned' }}</span></div></div>
              <div class="col-6"><div class="d-flex justify-content-between border-bottom py-2"><span class="text-muted">Slots Left</span><span>{{ selectedTrek.available_slots }}</span></div></div>
              <div class="col-6"><div class="d-flex justify-content-between py-2"><span class="text-muted">Status</span><span class="badge" :class="'badge-'+selectedTrek.status.toLowerCase()">{{ selectedTrek.status }}</span></div></div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
            <button
              class="btn btn-primary"
              :disabled="selectedTrek.available_slots===0 || selectedTrek.status!=='Open'"
              @click="openBookConfirm(selectedTrek)">
              {{ selectedTrek.available_slots===0 || selectedTrek.status!=='Open' ? 'Not Available' : 'Book Now' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- BOOK CONFIRM MODAL -->
    <div class="modal fade" id="bookConfirmModal" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content" v-if="bookingTrek">
          <div class="modal-header">
            <h5 class="modal-title">Confirm Booking</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <p>Are you sure you want to book <strong>{{ bookingTrek.name }}</strong>?</p>
            <div class="d-flex justify-content-between border-bottom py-2">
              <span class="text-muted">Location</span><span>{{ bookingTrek.location }}</span>
            </div>
            <div class="d-flex justify-content-between border-bottom py-2">
              <span class="text-muted">Duration</span><span>{{ bookingTrek.duration_days }} Days</span>
            </div>
            <div class="d-flex justify-content-between border-bottom py-2">
              <span class="text-muted">Available Slots</span><span>{{ bookingTrek.available_slots }}</span>
            </div>
            <div class="d-flex justify-content-between py-2">
              <span class="text-muted">Start Date</span><span>{{ formatDate(bookingTrek.start_date) }}</span>
            </div>
            <div v-if="bookErr" class="text-danger mt-3">{{ bookErr }}</div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
            <button class="btn btn-primary" @click="confirmBook">Confirm Booking</button>
          </div>
        </div>
      </div>
    </div>

    <!-- CANCEL CONFIRM MODAL -->
    <div class="modal fade" id="cancelConfirmModal" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content" v-if="cancelBooking">
          <div class="modal-header">
            <h5 class="modal-title">Cancel Booking</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <p class="mb-0">Are you sure you want to cancel your booking for <strong>{{ cancelBooking.trek_name }}</strong>?</p>
            <div v-if="cancelErr" class="text-danger mt-2">{{ cancelErr }}</div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" data-bs-dismiss="modal">Keep Booking</button>
            <button class="btn btn-danger" @click="confirmCancel">Yes, Cancel</button>
          </div>
        </div>
      </div>
    </div>

  </div>
  `,

  data() {
    return {
      view: 'dashboard',
      savingProfile: false,
      viewTitles: {
        dashboard: 'Dashboard', browse: 'Browse Treks',
        mybookings: 'My Bookings', history: 'History', profile: 'Profile'
      },
      userName: localStorage.getItem('name') || 'Trekker',
      dashTreks: [],
      browsetreks: [],
      myBookings: [],
      history: [],
      profile: {},
      profileForm: { name: '', phone: '' },
      editingProfile: false,
      profileErr: '',
      filters: { search: '', difficulty: '', sort: '' },
      selectedTrek: null,
      bookingTrek: null,
      cancelBooking: null,
      bookErr: '', cancelErr: '',
      csvMsg: '',
      trekDetailModalInst: null,
      bookConfirmModalInst: null,
      cancelConfirmModalInst: null,
    }
  },

  mounted() {
    this.trekDetailModalInst   = new bootstrap.Modal(document.getElementById('trekDetailModal'))
    this.bookConfirmModalInst  = new bootstrap.Modal(document.getElementById('bookConfirmModal'))
    this.cancelConfirmModalInst = new bootstrap.Modal(document.getElementById('cancelConfirmModal'))
    this.loadDashboard()
  },

  methods: {
    switchView(v) {
      this.view = v
      if(v === 'dashboard')   this.loadDashboard()
      if(v === 'browse')      this.loadBrowse()
      if(v === 'mybookings')  this.loadMyBookings()
      if(v === 'history')     this.loadHistory()
      if(v === 'profile')     this.loadProfile()
    },

    logout() {
      clearAuth()
      window.location.href = '/#/login'
    },

    headers() {
      return { Authorization: `Bearer ${getToken()}` }
    },

    formatDate(d) {
      if(!d) return '—'
      return new Date(d).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })
    },

    async loadDashboard() {
      try {
        const r = await axios.get('/api/user/treks', { headers: this.headers() })
        const treks = r.data.treks || []
        const open = treks
          .filter(t => t.status === 'Open' && t.available_slots > 0)
          .sort((a,b) => new Date(a.start_date) - new Date(b.start_date))
        this.dashTreks = open.slice(0, 3)
        await this.loadMyBookings()
      } catch(e) { console.error(e) }
    },

    async loadBrowse() {
      try {
        const params = new URLSearchParams()
        if(this.filters.search)     params.append('search', this.filters.search)
        if(this.filters.difficulty) params.append('difficulty', this.filters.difficulty)
        if(this.filters.sort)       params.append('sort', this.filters.sort)
        const r = await axios.get(`/api/user/treks?${params}`, { headers: this.headers() })
        this.browsetreks = r.data.treks || []
      } catch(e) { console.error(e) }
    },

    async loadMyBookings() {
      try {
        const r = await axios.get('/api/user/mybookings', { headers: this.headers() })
        this.myBookings = r.data.bookings || []
      } catch(e) { console.error(e) }
    },

    async loadHistory() {
      try {
        const r = await axios.get('/api/user/history', { headers: this.headers() })
        this.history = r.data.history || []
      } catch(e) { console.error(e) }
    },

    async loadProfile() {
      try {
        const r = await axios.get('/api/user/profile', { headers: this.headers() })
        this.profile = r.data
      } catch(e) { console.error(e) }
    },

    startEditProfile() {
      this.profileForm = { name: this.profile.name, phone: this.profile.phone }
      this.profileErr = ''
      this.editingProfile = true
    },

    async saveProfile() {
      this.profileErr = ''
      if(!/^\d{10}$/.test(this.profileForm.phone)) {
        this.profileErr = 'Phone must be exactly 10 digits'
        return
      }
      this.savingProfile = true
      try {
        await axios.put('/api/user/profile', this.profileForm, { headers: this.headers() })
        this.profile.name  = this.profileForm.name
        this.profile.phone = this.profileForm.phone
        localStorage.setItem('name', this.profileForm.name)
        this.userName = this.profileForm.name
        this.editingProfile = false
      } catch(e) {
        this.profileErr = e.response?.data?.message || 'Update failed'
      }finally {
          this.savingProfile = false
        }
    },

    openTrekDetail(trek) {
      this.selectedTrek = { ...trek }
      this.trekDetailModalInst.show()
    },

    openBookConfirm(trek) {
      this.bookingTrek = trek
      this.bookErr = ''
      this.trekDetailModalInst.hide()
      this.bookConfirmModalInst.show()
    },

    async confirmBook() {
      this.bookErr = ''
      try {
        await axios.post(`/api/user/book/${this.bookingTrek.id}`, {}, { headers: this.headers() })
        this.bookConfirmModalInst.hide()
        this.bookingTrek = null
        await this.loadDashboard()
        await this.loadBrowse()
        this.switchView('mybookings')
      } catch(e) {
        this.bookErr = e.response?.data?.message || 'Booking failed'
      }
    },

    openCancelConfirm(booking) {
      this.cancelBooking = booking
      this.cancelErr = ''
      this.cancelConfirmModalInst.show()
    },

    async confirmCancel() {
      this.cancelErr = ''
      try {
        await axios.patch(`/api/user/cancelbooking/${this.cancelBooking.id}`, {}, { headers: this.headers() })
        this.cancelConfirmModalInst.hide()
        this.cancelBooking = null
        this.loadMyBookings()
      } catch(e) {
        this.cancelErr = e.response?.data?.message || 'Cancellation failed'
      }
    },

    async exportCSV() {
      this.csvMsg = ''
      try {
        await axios.post('/api/user/exportcsv', {}, { headers: this.headers() })
        this.csvMsg = 'CSV export started - you will be notified when ready.'
      } catch(e) {
        this.csvMsg = e.response?.data?.message || 'Export failed'
      }
    },
    async viewBookedTrek(booking) {
        const trek = this.browsetreks.find(t => t.id === booking.trek_id)

        if (trek) {
            this.openTrekDetail(trek)
            return
        }

        await this.loadBrowse()

        const found = this.browsetreks.find(t => t.id === booking.trek_id)

        if (found) {
            this.openTrekDetail(found)
        }
    },
  }
}
