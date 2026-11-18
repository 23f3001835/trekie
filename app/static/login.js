// ─────────────────────────────────────────────
//  AUTH HELPERS
// ─────────────────────────────────────────────

function getToken() { return localStorage.getItem('token') }
function getRole()  { return localStorage.getItem('role')  }
function getName()  { return localStorage.getItem('name')  }

function setAuth(token, role, name) {
  localStorage.setItem('token', token)
  localStorage.setItem('role',  role)
  localStorage.setItem('name',  name)
}

function clearAuth() {
  localStorage.removeItem('token')
  localStorage.removeItem('role')
  localStorage.removeItem('name')
}

// Auto-attach JWT to every request
axios.interceptors.request.use(config => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})




// ─────────────────────────────────────────────
//  LOGIN
// ─────────────────────────────────────────────

const Login = {
  template: `
    <div class="d-flex align-items-center justify-content-center min-vh-100 bg-light p-3">
      <div class="card" style="width:100%;max-width:400px">
        <div class="card-body p-4">

          <h4 class="mb-1">Trekie</h4>
          <p class="text-muted mb-4">Login to your account</p>

          <div v-if="error" class="alert alert-danger py-2">{{ error }}</div>

          <div class="mb-3">
            <label class="form-label">Email address</label>
            <input
              v-model="email"
              type="email"
              class="form-control"
              placeholder="Email address"
              @keyup.enter="login"
            />
          </div>

          <div class="mb-3">
            <label class="form-label">Password</label>
            <input
              v-model="password"
              type="password"
              class="form-control"
              placeholder="Password"
              @keyup.enter="login"
            />
          </div>

          <button class="btn btn-primary w-100" @click="login" :disabled="loading">
            {{ loading ? 'Signing in...' : 'Login' }}
          </button>

          <p class="text-center mt-3 mb-0">
            Don't have an account?
            <a href="#" @click.prevent="$router.push('/register')">Register as User (Trekker)</a>
          </p>

        </div>

    </div>
  `,

  data() {
    return { email: '', password: '', error: '', loading: false }
  },

  methods: {
    async login() {
      this.error   = ''
      this.loading = true

      if (!this.email || !this.password) {
        this.error   = 'Please fill in all fields.'
        this.loading = false
        return
      }

      try {
        const res = await axios.post('/api/auth/login', {
          email:    this.email,
          password: this.password,
        })

        const { access_token, role, name } = res.data
        setAuth(access_token, role, name)

        if (role === 'admin')      this.$router.push('/admin/dashboard')
        else if (role === 'staff') this.$router.push('/staff/dashboard')
        else                       this.$router.push('/user/dashboard')

      } catch (err) {
        this.error = err.response?.data?.message || 'Login failed. Please try again.'
      } finally {
        this.loading = false
      }
    }
  }
}


// ─────────────────────────────────────────────
//  REGISTER
// ─────────────────────────────────────────────

const Register = {
  template: `
    <div class="d-flex align-items-center justify-content-center min-vh-100 bg-light p-3">
      <div class="card" style="width:100%;max-width:400px">
        <div class="card-body p-4">

          <h4 class="mb-1">Create User Account</h4>
          <p class="text-muted mb-4">Register as a Trekker</p>

          <div v-if="error"   class="alert alert-danger py-2">{{ error }}</div>
          <div v-if="success" class="alert alert-success py-2">{{ success }}</div>

          <div class="mb-3">
            <label class="form-label">Full Name</label>
            <input v-model="name" type="text" class="form-control" placeholder="Full Name"/>
          </div>

          <div class="mb-3">
            <label class="form-label">Email address</label>
            <input v-model="email" type="email" class="form-control" placeholder="Email address"/>
          </div>

          <div class="mb-3">
            <label class="form-label">Password</label>
            <input v-model="password" type="password" class="form-control" placeholder="Minimum 8 characters"/>
          </div>

          <div class="mb-3">
            <label class="form-label">Confirm Password</label>
            <input v-model="confirmPassword" type="password" class="form-control" placeholder="Confirm Password"/>
          </div>

          <div class="mb-3">
            <label class="form-label">Contact Number</label>
            <input
              v-model="phone"
              type="tel"
              class="form-control"
              placeholder="10-digit number"
              maxlength="10"
              @keyup.enter="register"
            />
          </div>

          <button class="btn btn-primary w-100" @click="register" :disabled="loading">
            {{ loading ? 'Creating account...' : 'Register' }}
          </button>

          <p class="text-center mt-3 mb-0">
            Already have an account?
            <a href="#" @click.prevent="$router.push('/login')">Login here</a>
          </p>

        </div>
        <div class="card-footer small text-muted">
          Note: Only Users (Trekkers) can register themselves. Trekking Staff are created by Admin.
        </div>
      </div>
    </div>
  `,

  data() {
    return {
      name: '', email: '', phone: '',
      password: '', confirmPassword: '',
      error: '', success: '', loading: false,
    }
  },

  methods: {
    async register() {
      this.error   = ''
      this.success = ''
      this.loading = true

      if (!this.name || !this.email || !this.phone || !this.password || !this.confirmPassword) {
        this.error = 'Please fill in all fields.'
        this.loading = false
        return
      }

      if (this.password.length < 8) {
        this.error = 'Password must be at least 8 characters.'
        this.loading = false
        return
      }

      if (this.password !== this.confirmPassword) {
        this.error = 'Passwords do not match.'
        this.loading = false
        return
      }

      if (!/^\d{10}$/.test(this.phone)) {
        this.error = 'Phone must be exactly 10 digits.'
        this.loading = false
        return
      }

      try {
        await axios.post('/api/auth/signup', {
          name: this.name, email: this.email,
          phone: this.phone, password: this.password,
        })

        this.success = 'Account created! Redirecting to login...'
        setTimeout(() => this.$router.push('/login'), 1500)

      } catch (err) {
        this.error = err.response?.data?.message || 'Registration failed. Please try again.'
      } finally {
        this.loading = false
      }
    }
  }
}
