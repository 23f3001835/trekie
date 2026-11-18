// ─────────────────────────────────────────────
//  STAFF DASHBOARD
// ─────────────────────────────────────────────

const StaffDashboard = {
  template: `
  <div style="min-height:100vh;background:#fff">

    <!-- SIDEBAR -->
    <aside class="side-nav">
      <div class="mb-3">
        <h5 class="mb-0">Trekie</h5>
        <small class="text-muted">Staff Panel</small>
      </div>

      <nav class="nav nav-pills flex-column">
        <a class="nav-link" href="#" :class="{active: view==='dashboard' || view==='manage'}" @click.prevent="switchView('dashboard')">Dashboard</a>
        <a class="nav-link" href="#" :class="{active: view==='profile'}" @click.prevent="switchView('profile')">Profile</a>
      </nav>

      <hr>
      <a class="nav-link text-danger" href="#" @click.prevent="logout">Logout</a>
    </aside>

    <!-- MAIN -->
    <div class="side-main">

      <!-- TOPBAR -->
      <div class="d-flex justify-content-between align-items-center border-bottom px-4 py-3">
        <h5 class="mb-0">{{ viewTitles[view] }}</h5>
        <span>{{ staffName }} (Trekking Staff)</span>
      </div>

      <!-- PAGE CONTENT -->
      <div class="p-4">

        <!-- DASHBOARD -->
        <div v-if="view==='dashboard'">

          <div class="row g-3 mb-4">
            <div class="col-md-4">
              <div class="card"><div class="card-body">
                <div class="text-muted">Assigned Treks</div>
                <div class="fs-3 fw-bold">{{ dashData.assigned_treks ?? '—' }}</div>
              </div></div>
            </div>
            <div class="col-md-4">
              <div class="card"><div class="card-body">
                <div class="text-muted">Total Participants</div>
                <div class="fs-3 fw-bold">{{ dashData.treks ? dashData.treks.reduce((sum, t) => sum + (t.total_slots - t.available_slots), 0) : '—' }}</div>
              </div></div>
            </div>
            <div class="col-md-4">
              <div class="card"><div class="card-body">
                <div class="text-muted">Ongoing Treks</div>
                <div class="fs-3 fw-bold">{{ dashData.ongoing_treks ?? '—' }}</div>
              </div></div>
            </div>
          </div>

          <h6>My Assigned Treks</h6>
          <table class="table table-bordered table-hover">
            <thead>
              <tr>
                <th>Trek Name</th>
                <th>Start Date</th>
                <th>Participants</th>
                <th>Slots</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!dashData.treks?.length">
                <td colspan="6" class="text-center text-muted py-4">No treks assigned yet</td>
              </tr>
              <tr v-for="t in dashData.treks" :key="t.id">
                <td>{{ t.name }}</td>
                <td>{{ formatDate(t.start_date) }}</td>
                <td>{{ t.total_slots - t.available_slots }}</td>
                <td>{{ t.available_slots }} / {{ t.total_slots }}</td>
                <td><span class="badge" :class="'badge-'+(t.status||'').toLowerCase()">{{ t.status }}</span></td>
                <td>
                  <button
                    v-if="t.status !== 'Completed'"
                    class="btn btn-sm btn-outline-primary"
                    @click="openManage(t.id)">
                    {{ t.status === 'Closed' ? 'View' : 'Manage' }}
                  </button>
                  <span v-else class="text-muted">Completed</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- MANAGE TREK -->
        <div v-if="view==='manage'">
          <div class="mb-3">
            <a href="#" @click.prevent="switchView('dashboard')">← Back to My Treks</a>
          </div>

          <div class="row g-3" v-if="activeTrek">

            <!-- LEFT: Trek Details -->
            <div class="col-md-4">
              <div class="card">
                <div class="card-header fw-bold">Trek Details</div>
                <div class="card-body">
                  <div class="d-flex justify-content-between border-bottom py-2">
                    <span class="text-muted">Location</span><span>{{ activeTrek.location }}</span>
                  </div>
                  <div class="d-flex justify-content-between border-bottom py-2">
                    <span class="text-muted">Difficulty</span><span>{{ activeTrek.difficulty }}</span>
                  </div>
                  <div class="d-flex justify-content-between border-bottom py-2">
                    <span class="text-muted">Duration</span><span>{{ activeTrek.duration_days }} Days</span>
                  </div>
                  <div class="d-flex justify-content-between border-bottom py-2">
                    <span class="text-muted">Start Date</span><span>{{ formatDate(activeTrek.start_date) }}</span>
                  </div>
                  <div class="d-flex justify-content-between border-bottom py-2">
                    <span class="text-muted">Total Slots</span><span>{{ activeTrek.total_slots }}</span>
                  </div>
                  <div class="d-flex justify-content-between py-2">
                    <span class="text-muted">Available Slots</span><span>{{ activeTrek.available_slots }}</span>
                  </div>

                  <div class="mt-3" v-if="activeTrek.status !== 'Completed'">
                    <label class="form-label">Status</label>
                    <select class="form-select mb-3" v-model="selectedStatus">
                      <option>Open</option>
                      <option>Closed</option>
                    </select>
                    <button class="btn btn-primary w-100 mb-2" @click="updateStatus">Update Trek</button>
                    <button class="btn btn-success w-100" @click="completeTrek">Mark as Completed</button>
                  </div>

                  <div v-else class="mt-3 text-center text-muted">
                    This trek is completed
                  </div>

                  <div v-if="manageMsg" class="text-success mt-3 text-center">{{ manageMsg }}</div>
                  <div v-if="manageErr" class="text-danger mt-3 text-center">{{ manageErr }}</div>
                </div>
              </div>
            </div>

            <!-- RIGHT: Participants -->
            <div class="col-md-8">
              <h6>Participants ({{ participants.length }})</h6>
              <table class="table table-bordered table-hover">
                <thead>
                  <tr><th>#</th><th>Name</th><th>Email</th><th>Phone</th><th>Booking Date</th></tr>
                </thead>
                <tbody>
                  <tr v-if="!participants.length">
                    <td colspan="5" class="text-center text-muted py-4">No participants yet</td>
                  </tr>
                  <tr v-for="(p, i) in participants" :key="i">
                    <td>{{ i+1 }}</td>
                    <td>{{ p.name }}</td>
                    <td>{{ p.email }}</td>
                    <td>{{ p.phone }}</td>
                    <td>{{ formatDate(p.booking_date) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

          </div>
        </div>

        <!-- PROFILE -->
        <div v-if="view==='profile'">
          <div class="card" style="max-width:480px">
            <div class="card-header fw-bold">My Profile</div>
            <div class="card-body">
              <div class="d-flex justify-content-between border-bottom py-2">
                <span class="text-muted">Name</span><span>{{ profile.name ?? '—' }}</span>
              </div>
              <div class="d-flex justify-content-between border-bottom py-2">
                <span class="text-muted">Email</span><span>{{ profile.email ?? '—' }}</span>
              </div>
              <div class="d-flex justify-content-between border-bottom py-2">
                <span class="text-muted">Phone</span><span>{{ profile.phone ?? '—' }}</span>
              </div>
              <div class="d-flex justify-content-between border-bottom py-2">
                <span class="text-muted">Specialization</span><span>{{ profile.specialization ?? '—' }}</span>
              </div>
              <div class="d-flex justify-content-between border-bottom py-2">
                <span class="text-muted">Experience</span><span>{{ profile.experience ?? '—' }}</span>
              </div>
              <div class="d-flex justify-content-between py-2">
                <span class="text-muted">Availability</span>
                <span class="badge" :class="profile.is_available ? 'badge-open' : 'badge-closed'">
                  {{ profile.is_available ? 'Available' : 'On Trek' }}
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
  `,

  data() {
    return {
      view: 'dashboard',
      viewTitles: { dashboard: 'My Dashboard', manage: 'Manage Trek', profile: 'Profile' },
      staffName: localStorage.getItem('name') || 'Staff',
      dashData: {},
      activeTrek: null,
      participants: [],
      selectedStatus: 'Open',
      manageMsg: '', manageErr: '',
      profile: {},
    }
  },

  mounted() {
    this.loadDashboard()
  },

  methods: {
    switchView(v) {
      this.view = v
      this.manageMsg = ''
      this.manageErr = ''
      if(v === 'dashboard') this.loadDashboard()
      if(v === 'profile')   this.loadProfile()
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
        const r = await axios.get('/api/staff/dashboard', { headers: this.headers() })
        this.dashData = r.data
      } catch(e) { console.error(e) }
    },

    async openManage(trekId) {
      try {
        const r = await axios.get(`/api/staff/mytreks/${trekId}`, { headers: this.headers() })
        this.activeTrek = r.data.trek
        this.participants = r.data.participants
        this.selectedStatus = r.data.trek.status
        this.manageMsg = ''
        this.manageErr = ''
        this.view = 'manage'
      } catch(e) {
        alert(e.response?.data?.message || 'Could not load trek')
      }
    },

    async updateStatus() {
      this.manageMsg = ''
      this.manageErr = ''
      try {
        await axios.patch(
          `/api/staff/mytreks/${this.activeTrek.id}/updatestatus`,
          { status: this.selectedStatus },
          { headers: this.headers() }
        )
        this.activeTrek.status = this.selectedStatus
        this.manageMsg = `Status updated to ${this.selectedStatus}`
        this.loadDashboard()
      } catch(e) {
        this.manageErr = e.response?.data?.message || 'Update failed'
      }
    },

    async completeTrek() {
      if(!confirm('Mark this trek as Completed? This cannot be undone.')) return
      this.manageMsg = ''
      this.manageErr = ''
      try {
        await axios.patch(
          `/api/staff/mytreks/${this.activeTrek.id}/complete`,
          {},
          { headers: this.headers() }
        )
        this.activeTrek.status = 'Completed'
        this.manageMsg = 'Trek marked as Completed'
        await this.loadDashboard()
        this.switchView("dashboard")
      } catch(e) {
        this.manageErr = e.response?.data?.message || 'Could not complete trek'
      }
    },

    async loadProfile() {
      try {
        const r = await axios.get('/api/staff/profile', { headers: this.headers() })
        this.profile = r.data
      } catch(e) {
        console.error(e)
      }
    },
  }
}
