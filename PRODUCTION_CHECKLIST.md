# Production Checklist

## Must Do Before Launch

### Backend
- [ ] Replace SQLite with PostgreSQL (SQLite doesn't handle concurrent writes)
- [ ] Add rate limiting (`express-rate-limit`) on auth and API routes
- [ ] Add `helmet` middleware for security headers
- [ ] Add input validation with `zod` or `joi` on all endpoints
- [ ] Set up proper logging (`winston` or `pino`) — replace console.log/error
- [ ] Enforce HTTPS redirect in Express
- [ ] Set strong JWT secret in env (not default)
- [ ] Set `NODE_ENV=production`
- [ ] Remove `morgan('dev')` — use `'combined'` format in production

### Admin Dashboard
- [ ] Set `VITE_API_URL` to production backend URL (remove ngrok)
- [ ] Add error boundary component wrapping `<App />`
- [ ] Build for production: `npm run build`
- [ ] Serve via nginx/CDN with HTTPS

### Mobile App
- [ ] Update `config.js` — replace ngrok URL with production backend URL
- [ ] Build production APK/AAB: `eas build --platform android --profile production`
- [ ] Test on multiple Android versions (API 28+)
- [ ] App signing — use upload key for Play Store

### Database
- [ ] Migrate from SQLite to PostgreSQL
- [ ] Set up automated backups
- [ ] Run seed on production DB
- [ ] Add indexes on frequently queried columns (`userId`, `stationId`, `status`)

### Security
- [ ] Audit all endpoints for auth — ensure no unprotected admin routes
- [ ] Hash all passwords (already using bcrypt — verify rounds >= 10)
- [ ] Ensure `.env` files are NOT in git (already in `.gitignore` — double check)
- [ ] Set CORS to only allow production domains (not `*`)
- [ ] Add request size limits (`express.json({ limit: '1mb' })`)

### Infrastructure
- [ ] Set up domain with SSL certificate
- [ ] Deploy backend to cloud (Cloud Run / Railway / VPS)
- [ ] Deploy admin dashboard to static hosting (Vercel / Netlify / nginx)
- [ ] Set up health check monitoring
- [ ] Set up error alerting (Sentry or similar)

---

## Nice to Have (Post-Launch)
- [ ] Add forgot password email (currently returns token in response)
- [ ] Push notifications for queue updates
- [ ] Offline support in mobile app
- [ ] Admin audit log
- [ ] API versioning (`/api/v1/`)
