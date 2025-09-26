const express = require('express');
const session = require('express-session');
const Controller = require('./controllers/controller');

const app = express();
const port = 3000;

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: false }));

// ===== session =====
app.use(session({
  secret: 'dev-secret', 
  resave: false,
  saveUninitialized: false,
  cookie: {
    sameSite: true,
    secure: false, 
  }
}));

// expose session user ke semua view
app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  next();
});

// ===== guards =====
function requireAuth(req, res, next) {
  if (!req.session.user) return res.redirect('/login');
  next();
}
function requireAdmin(req, res, next) {
  if (req.session.user?.role === 'Admin') return next();
  return res.status(403).send('Forbidden: Admin only');
}
function requireUser(req, res, next) {
  if (req.session.user?.role === 'User') return next();
  return res.status(403).send('Forbidden: User only');
}
function ownerOrAdmin(param = 'id') {
  return (req, res, next) => {
    const me = req.session.user;
    const targetId = Number(req.params[param]);
    if (me?.role === 'Admin' || me?.id === targetId) return next();
    return res.status(403).send('Forbidden');
  };
}

app.use((req, res, next) => {
  res.locals.success = req.query.success ? [req.query.success] : [];
  res.locals.error   = req.query.error   ? [req.query.error]   : [];
  next();
});

// ===== PUBLIC =====
// HOME
app.get('/', Controller.home);

// REGISTER
app.get('/register', Controller.getRegister);
app.post('/register', Controller.postRegister);

// LOGIN + LOGOUT
app.get('/login', Controller.getLogin);
app.post('/login', Controller.postLogin);
app.get('/logout', requireAuth, Controller.logout);

// ===== USER AREA  =====
app.get('/userHome/:id', requireAuth, requireUser, ownerOrAdmin('id'), (req, res) => {
  const { id } = req.params;
  res.render('UserHome', { id });
});

app.get('/getProfile/:id',    requireAuth, requireUser, ownerOrAdmin('id'), Controller.getProfile);
app.post('/getProfile/:id',   requireAuth, requireUser, ownerOrAdmin('id'), Controller.postProfile);
app.get('/getEditProfile/:id',    requireAuth, requireUser, ownerOrAdmin('id'), Controller.getEditProfile);
app.post('/getEditProfile/:id',   requireAuth, requireUser, ownerOrAdmin('id'), Controller.postEditProfile);
app.get('/myProfile/:id',     requireAuth, requireUser, ownerOrAdmin('id'), Controller.myProfile);
app.get('/myDonations/:id',   requireAuth, requireUser, ownerOrAdmin('id'), Controller.myDonations);
app.get('/myCampaign/:id',    requireAuth, requireUser, ownerOrAdmin('id'), Controller.myCampaigns);
app.get('/myCampaign/:campaignId/delete/:userId', requireAuth, ownerOrAdmin('userId'), Controller.deleteCampaign);

app.get('/campaignList/:id',  requireAuth, requireUser, ownerOrAdmin('id'), Controller.campaignList);
app.get('/addCampaign/:id',   requireAuth, requireUser, ownerOrAdmin('id'), Controller.getCampaign);
app.post('/addCampaign/:id',  requireAuth, requireUser, ownerOrAdmin('id'), Controller.postCampaign);

app.get('/donate/:userId/:campaignId',  requireAuth, ownerOrAdmin('userId'), Controller.getDonate);
app.post('/donate/:userId/:campaignId', requireAuth, ownerOrAdmin('userId'), Controller.postDonate);

// ===== ADMIN AREA  =====
app.get('/adminHome/:id', requireAuth, requireAdmin, (req, res) => {
  const { id } = req.params;
  res.render('AdminHome', { id });
});

app.get('/adminCampaignList',                    requireAuth, requireAdmin, Controller.adminCampaign);
app.get('/adminCampaignList/:campaignId/delete', requireAuth, requireAdmin, Controller.adminDeleteCampaign);

app.get('/userList',                requireAuth, requireAdmin, Controller.userList);
app.get('/userList/:userId/delete', requireAuth, requireAdmin, Controller.deleteUser);

app.get('/donationList', requireAuth, requireAdmin, Controller.donationList);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
