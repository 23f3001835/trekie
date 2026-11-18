// ─────────────────────────────────────────────
//  ADMIN DASHBOARD
// ─────────────────────────────────────────────

const AdminDashboard = {
  template: `
  <div style="min-height:100vh;background:#fff">

    <!-- SIDEBAR -->
    <aside class="side-nav">
      <div class="mb-3">
        <h5 class="mb-0">Trekie</h5>
        <small class="text-muted">Admin Panel</small>
      </div>

      <nav class="nav nav-pills flex-column">
        <a class="nav-link" href="#" :class="{active: view==='dashboard'}" @click.prevent="switchView('dashboard')">Dashboard</a>
        <a class="nav-link" href="#" :class="{active: view==='treks'}"     @click.prevent="switchView('treks')">Treks</a>
        <a class="nav-link" href="#" :class="{active: view==='staff'}"     @click.prevent="switchView('staff')">Trekking Staff</a>
        <a class="nav-link" href="#" :class="{active: view==='users'}"     @click.prevent="switchView('users')">Users (Trekkers)</a>
        <a class="nav-link" href="#" :class="{active: view==='bookings'}"  @click.prevent="switchView('bookings')">Bookings</a>
      </nav>

      <hr>
      <a class="nav-link text-danger" href="#" @click.prevent="logout">Logout</a>
    </aside>

    <!-- MAIN -->
    <div class="side-main">

      <!-- TOPBAR -->
      <div class="d-flex justify-content-between align-items-center border-bottom px-4 py-3">
        <h5 class="mb-0">{{ viewTitles[view] }}</h5>
        <span>{{ adminName }} (Admin)</span>
      </div>

      <!-- PAGE CONTENT -->
      <div class="p-4">

        <!-- DASHBOARD -->
        <div v-if="view==='dashboard'">
          <div class="row g-3 mb-4">
            <div class="col-md-3">
              <div class="card"><div class="card-body">
                <div class="text-muted">Total Treks</div>
                <div class="fs-3 fw-bold">{{ stats.total_treks ?? '—' }}</div>
              </div></div>
            </div>
            <div class="col-md-3">
              <div class="card"><div class="card-body">
                <div class="text-muted">Total Users (Trekkers)</div>
                <div class="fs-3 fw-bold">{{ stats.total_users ?? '—' }}</div>
              </div></div>
            </div>
            <div class="col-md-3">
              <div class="card"><div class="card-body">
                <div class="text-muted">Total Trekking Staff</div>
                <div class="fs-3 fw-bold">{{ stats.total_staff ?? '—' }}</div>
              </div></div>
            </div>
            <div class="col-md-3">
              <div class="card"><div class="card-body">
                <div class="text-muted">Total Bookings</div>
                <div class="fs-3 fw-bold">{{ stats.total_bookings ?? '—' }}</div>
              </div></div>
            </div>
          </div>

          <h6>Recent Bookings</h6>
          <table class="table table-bordered table-hover">
            <thead>
              <tr><th>Booking ID</th><th>User (Trekker)</th><th>Trek</th><th>Booking Date</th><th>Status</th></tr>
            </thead>
            <tbody>
              <tr v-if="!stats.recent_bookings?.length"><td colspan="5" class="text-center text-muted py-4">No bookings yet</td></tr>
              <tr v-for="b in stats.recent_bookings" :key="b.id">
                <td>#{{ b.id }}</td>
                <td>{{ b.user_name ?? '—' }}</td>
                <td>{{ b.trek_name ?? '—' }}</td>
                <td>{{ b.booking_date ?? '—' }}</td>
                <td><span class="badge" :class="'badge-'+(b.status||'').toLowerCase()">{{ b.status }}</span></td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- TREKS -->
        <div v-if="view==='treks'">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <input class="form-control" style="max-width:300px" placeholder="Search treks..." v-model="trekSearch" @input="loadTreks"/>
            <button class="btn btn-primary" @click="openTrekModal()">+ Add New Trek</button>
          </div>
          <table class="table table-bordered table-hover">
            <thead>
              <tr><th>ID</th><th>Trek Name</th><th>Location</th><th>Staff</th><th>Difficulty</th><th>Slots</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              <tr v-if="!treks.length"><td colspan="8" class="text-center text-muted py-4">No treks found</td></tr>
              <tr v-for="t in treks" :key="t.id">
                <td>{{ t.id }}</td>
                <td>{{ t.name }}</td>
                <td>{{ t.location }}</td>
                <td>{{ t.assigned_staff_name || "Not Assigned" }}</td>
                <td>{{ t.difficulty }}</td>
                <td>{{ t.available_slots }} / {{ t.total_slots }}</td>
                <td><span class="badge" :class="'badge-'+(t.status||'').toLowerCase()">{{ t.status }}</span></td>
                <td>
                  <button class="btn btn-sm btn-outline-primary me-1" @click="openTrekModal(t)">Edit</button>
                  <button class="btn btn-sm btn-outline-danger" @click="deleteTrek(t.id)">Delete</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- STAFF -->
        <div v-if="view==='staff'">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <input class="form-control" style="max-width:300px" placeholder="Search staff..." v-model="staffSearch" @input="loadStaff"/>
            <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#staffModal">+ Add Staff</button>
          </div>
          <table class="table table-bordered table-hover">
            <thead>
              <tr><th>ID</th><th>Name</th><th>Email</th><th>Contact</th><th>Specialization</th><th>Status</th><th>Action</th></tr>
            </thead>
            <tbody>
              <tr v-if="!staff.length"><td colspan="7" class="text-center text-muted py-4">No staff found</td></tr>
              <tr v-for="s in staff" :key="s.id">
                <td>{{ s.id }}</td>
                <td>{{ s.user_name }}</td>
                <td>{{ s.user_email }}</td>
                <td>{{ s.user_phone }}</td>
                <td>{{ s.specialization ?? '—' }}</td>
                <td><span class="badge" :class="'badge-'+(s.user_status||'').toLowerCase()">{{ s.user_status }}</span></td>
                <td>
                  <button v-if="s.user_status==='blacklisted'" class="btn btn-sm btn-outline-success" @click="toggleStaff(s.user_id,'whitelist')">Whitelist</button>
                  <button v-else class="btn btn-sm btn-outline-danger" @click="toggleStaff(s.user_id,'blacklist')">Blacklist</button>
                </td>
              </tr>
            </tbody>
          </table>
          <div class="alert alert-secondary py-2">Blacklisted staff cannot login or access the system.</div>
        </div>

        <!-- USERS -->
        <div v-if="view==='users'">
          <div class="mb-3">
            <input class="form-control" style="max-width:300px" placeholder="Search users..." v-model="userSearch" @input="loadUsers"/>
          </div>
          <table class="table table-bordered table-hover">
            <thead>
              <tr><th>ID</th><th>Name</th><th>Email</th><th>Contact</th><th>Status</th><th>Action</th></tr>
            </thead>
            <tbody>
              <tr v-if="!users.length"><td colspan="6" class="text-center text-muted py-4">No users found</td></tr>
              <tr v-for="u in users" :key="u.id">
                <td>{{ u.id }}</td>
                <td>{{ u.name }}</td>
                <td>{{ u.email }}</td>
                <td>{{ u.phone }}</td>
                <td><span class="badge" :class="'badge-'+(u.status||'').toLowerCase()">{{ u.status }}</span></td>
                <td>
                  <button v-if="u.status==='blacklisted'" class="btn btn-sm btn-outline-success" @click="toggleUser(u.id,'whitelist')">Whitelist</button>
                  <button v-else class="btn btn-sm btn-outline-danger" @click="toggleUser(u.id,'blacklist')">Blacklist</button>
                </td>
              </tr>
            </tbody>
          </table>
          <div class="alert alert-secondary py-2">Blacklisted users cannot login or book treks.</div>
        </div>

        <!-- BOOKINGS -->
        <div v-if="view==='bookings'">
          <table class="table table-bordered table-hover">
            <thead>
              <tr><th>Booking ID</th><th>User (Trekker)</th><th>Trek</th><th>Booking Date</th><th>Status</th></tr>
            </thead>
            <tbody>
              <tr v-if="!bookings.length"><td colspan="5" class="text-center text-muted py-4">No bookings found</td></tr>
              <tr v-for="b in bookings" :key="b.id">
                <td>#{{ b.id }}</td>
                <td>{{ b.user_name ?? '—' }}</td>
                <td>{{ b.trek_name ?? '—' }}</td>
                <td>{{ b.booking_date ?? '—' }}</td>
                <td><span class="badge" :class="'badge-'+(b.status||'').toLowerCase()">{{ b.status }}</span></td>
              </tr>
            </tbody>
          </table>
        </div>

      </div>
    </div>

    <!-- TREK MODAL -->
    <div class="modal fade" id="trekModal" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ trekForm.id ? 'Edit Trek' : 'Add New Trek' }}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <div class="row g-3">
              <div class="col-6">
                <label class="form-label">Trek Name</label>
                <input class="form-control" v-model="trekForm.name" placeholder="Everest Base Camp"/>
              </div>
              <div class="col-6">
                <label class="form-label">Location</label>
                <input class="form-control" v-model="trekForm.location" placeholder="Nepal"/>
              </div>
              <div class="col-6">
                <label class="form-label">Difficulty</label>
                <select class="form-select" v-model="trekForm.difficulty">
                  <option value="">Select</option>
                  <option>Easy</option><option>Moderate</option><option>Hard</option>
                </select>
              </div>
              <div class="col-6">
                <label class="form-label">Status</label>
                <select class="form-select" v-model="trekForm.status">
                  <option value="">Select</option>
                  <option>Open</option><option>Closed</option>
                </select>
              </div>
              <div class="col-6">
                <label class="form-label">Start Date</label>
                <input class="form-control" type="date" v-model="trekForm.start_date"/>
              </div>
              <div class="col-6">
                <label class="form-label">Duration (days)</label>
                <input class="form-control" type="number" v-model="trekForm.duration_days" placeholder="7"/>
              </div>
              <div class="col-6">
                <label class="form-label">Total Slots</label>
                <input class="form-control" type="number" v-model="trekForm.total_slots" placeholder="20"/>
              </div>
              <div class="col-6">
                <label class="form-label">Assigned Staff</label>
                <select class="form-select" v-model="trekForm.assigned_staff_id">
                  <option value="">No Staff</option>
                  <option v-for="staff in availableStaff" :key="staff.user_id" :value="staff.user_id">{{ staff.user_name }}</option>
                </select>
              </div>
              <div class="col-6">
                <label class="form-label">Image URL</label>
                <input class="form-control" v-model="trekForm.image_url" placeholder="https://..."/>
              </div>
            </div>
            <div v-if="formError" class="text-danger mt-3">{{ formError }}</div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
            <button class="btn btn-primary" @click="submitTrek">{{ trekForm.id ? 'Update Trek' : 'Create Trek' }}</button>
          </div>
        </div>
      </div>
    </div>

    <!-- STAFF MODAL -->
    <div class="modal fade" id="staffModal" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Create New Trekking Staff</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <div class="row g-3">
              <div class="col-6">
                <label class="form-label">Full Name</label>
                <input class="form-control" v-model="staffForm.name" placeholder="Vikas Singh"/>
              </div>
              <div class="col-6">
                <label class="form-label">Email Address</label>
                <input class="form-control" v-model="staffForm.email" placeholder="vikas@gmail.com"/>
              </div>
              <div class="col-6">
                <label class="form-label">Contact Number</label>
                <input class="form-control" v-model="staffForm.phone" placeholder="10-digit number"/>
              </div>
              <div class="col-6">
                <label class="form-label">Password</label>
                <input class="form-control" type="password" v-model="staffForm.password" placeholder="Temporary password"/>
              </div>
              <div class="col-6">
                <label class="form-label">Specialization</label>
                <input class="form-control" v-model="staffForm.specialization" placeholder="High Altitude, First Aid"/>
              </div>
              <div class="col-6">
                <label class="form-label">Experience</label>
                <input class="form-control" v-model="staffForm.experience" placeholder="5 years"/>
              </div>
            </div>
            <div v-if="staffFormError" class="text-danger mt-3">{{ staffFormError }}</div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
            <button class="btn btn-primary" @click="createStaff">Create Staff</button>
          </div>
        </div>
      </div>
    </div>

  </div>
  `,



  data() {
    return {
      view: 'dashboard',
      viewTitles: {
        dashboard: 'Dashboard', treks: 'Treks', staff: 'Trekking Staff',
        users: 'Users (Trekkers)', bookings: 'Bookings', reports: 'Reports'
      },
      adminName: localStorage.getItem('name') || 'Admin',
      stats: {},
      treks: [], trekSearch: '',
      staff: [], staffSearch: '',
      users: [], userSearch: '',
      availableStaff: [],
      bookings: [],
      trekForm: {
          name: "",
          location: "",
          difficulty: "",
          status: "Open",
          start_date: "",
          duration_days: "",
          total_slots: "",
          image_url: "",
          assigned_staff_id: ""
      },
      staffForm: { name:'', email:'', phone:'', password:'', specialization:'', experience:'' },
      formError: '', staffFormError: '',
      trekModalInst: null, staffModalInst: null,
    }
  },



  mounted() {
    this.trekModalInst  = new bootstrap.Modal(document.getElementById('trekModal'))
    this.staffModalInst = new bootstrap.Modal(document.getElementById('staffModal'))
    this.loadStats()
  },



  methods: {
    switchView(v) {
      this.view = v
      if(v==='dashboard') this.loadStats()
      if(v==='treks')     this.loadTreks()
      if(v==='staff')     this.loadStaff()
      if(v==='users')     this.loadUsers()
      if(v==='bookings')  this.loadBookings()
    },

    logout() {
        clearAuth()
        this.$router.push("/login")
    },

    headers() { return { Authorization: `Bearer ${localStorage.getItem('token')}` } },

    async loadStats() {
      try {
        const r = await axios.get('/api/admin/stats', { headers: this.headers() })
        this.stats = r.data
      } catch(e) { console.error(e) }
    },

    async loadTreks() {
      try {
        const url = this.trekSearch ? `/api/admin/showtreks?search=${this.trekSearch}` : '/api/admin/showtreks'
        const r = await axios.get(url, { headers: this.headers() })
        this.treks = r.data.treks || []
      } catch(e) { console.error(e) }
    },

    async openTrekModal(trek = null) {
        this.formError = "";

        try {
            const res = await axios.get(
                "/api/admin/createtrek",
                { headers: this.headers() });
            this.availableStaff = res.data.staff;
        } catch (e) {
            console.error(e);}

        if (trek) {
            this.trekForm = {
                id: trek.id,
                name: trek.name,
                location: trek.location,
                difficulty: trek.difficulty,
                status: trek.status,
                start_date: trek.start_date,
                duration_days: trek.duration_days,
                total_slots: trek.total_slots,
                image_url: trek.image_url || "",
                assigned_staff_id: trek.assigned_staff_id || ""
            };
        } else {
            this.trekForm = {
                id: null,
                name: "",
                location: "",
                difficulty: "",
                status: "Open",
                start_date: "",
                duration_days: "",
                total_slots: "",
                image_url: "",
                assigned_staff_id: ""
            };
        }
        this.trekModalInst.show();
    },

    async submitTrek() {
      this.formError = ''
      try {
        if(this.trekForm.id) {
          await axios.put(`/api/admin/managetrek/${this.trekForm.id}`, this.trekForm, { headers: this.headers() })
        } else {
          await axios.post('/api/admin/createtrek', this.trekForm, { headers: this.headers() })
        }
        this.trekModalInst.hide()
        this.loadTreks()
      } catch(e) { this.formError = e.response?.data?.message || 'Something went wrong' }
    },

    async deleteTrek(id) {
      if(!confirm('Delete this trek?')) return
      try {
        await axios.delete(`/api/admin/deletetrek/${id}`, { headers: this.headers() })
        this.loadTreks()
      } catch(e) { alert(e.response?.data?.message || 'Cannot delete trek') }
    },

    async loadStaff() {
      try {
        const url = this.staffSearch ? `/api/admin/showstaff?search=${this.staffSearch}` : '/api/admin/showstaff'
        const r = await axios.get(url, { headers: this.headers() })
        this.staff = r.data.staff || []
      } catch(e) { console.error(e) }
    },

    async createStaff() {
      this.staffFormError = ''
      try {
        await axios.post('/api/admin/createstaff', this.staffForm, { headers: this.headers() })
        this.staffModalInst.hide()
        this.staffForm = { name:'', email:'', phone:'', password:'', specialization:'', experience:'' }
        this.loadStaff()
      } catch(e) { this.staffFormError = e.response?.data?.message || 'Something went wrong' }
    },

    async toggleStaff(userId, action) {
      try {
        const url = action==='blacklist' ? `/api/admin/blackliststaff/${userId}` : `/api/admin/whiteliststaff/${userId}`
        await axios.patch(url, {}, { headers: this.headers() })
        this.loadStaff()
      } catch(e) { alert(e.response?.data?.message) }
    },

    async loadUsers() {
      try {
        const url = this.userSearch ? `/api/admin/showusers?search=${this.userSearch}` : '/api/admin/showusers'
        const r = await axios.get(url, { headers: this.headers() })
        this.users = r.data.users || []
      } catch(e) { console.error(e) }
    },

    async toggleUser(userId, action) {
      try {
        const url = action==='blacklist' ? `/api/admin/blacklistuser/${userId}` : `/api/admin/whitelistuser/${userId}`
        await axios.patch(url, {}, { headers: this.headers() })
        this.loadUsers()
      } catch(e) { alert(e.response?.data?.message) }
    },

    async loadBookings() {
      try {
        const r = await axios.get('/api/admin/showallbookings', { headers: this.headers() })
        this.bookings = r.data.all_bookings || []
      } catch(e) { console.error(e) }
    },
  }
}
