const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { sendEmail } = require('../util/maileratthost');
const { validationResult} = require('express-validator')
const User = require('../models/user');

/**
 * Small helper to build absolute URL like: https://example.com
 */
function getBaseUrl(req) {
  const proto = req.headers['x-forwarded-proto'] || req.protocol;
  const host = req.headers['x-forwarded-host'] || req.get('host');
  return `${proto}://${host}`;
}

exports.getLogin = (req, res, next) => {
  let message = req.flash('error');
  message = message.length > 0 ? message[0] : null;

  res.render('auth/login', {
    path: '/login',
    pageTitle: 'Login',
    errorMessage: message,
    oldInput: { email: '', password: '' },
    validationErrors: []      

  });
};

exports.postLogin = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).render('auth/login', {
      path: '/login',
      pageTitle: 'Login',
      errorMessage: errors.array()[0].msg,
      oldInput: { email, password },
      validationErrors: errors.array()
    });
  }

  User.findOne({ email })
    .then(user => {
      if (!user) {
        // CHANGED: render 422 with field markers instead of redirect
        return res.status(422).render('auth/login', {
          path: '/login',
          pageTitle: 'Login',
          errorMessage: 'Invalid email or password',
          oldInput: { email, password },
          validationErrors: [{ param: 'email' }, { param: 'password' }]
        });
      }

      return bcrypt.compare(password, user.password).then(doMatch => {
        if (doMatch) {
          req.session.isLoggedIn = true;
          req.session.user = user;
          return req.session.save(err => {
            if (err) console.log(err);
            return res.redirect('/');
          });
        }

        // CHANGED: previously validationErrors: []
        return res.status(422).render('auth/login', {
          path: '/login',
          pageTitle: 'Login',
          errorMessage: 'Invalid email or password',
          oldInput: { email, password },
          validationErrors: [{ path: 'email' }, { path: 'password' }]
        });
      });
    })
    .catch(err => {
      console.log('[LOGIN] error:', err);
      return res.status(422).render('auth/login', {
        path: '/login',
        pageTitle: 'Login',
        errorMessage: 'Something went wrong, please try again.',
        oldInput: { email, password },
        validationErrors: [{ param: 'email' }, { param: 'password' }]
      });
    });
};


exports.getSignup = (req, res, next) => {
  let message = req.flash('error');
  message = message.length > 0 ? message[0] : null;

  res.render('auth/signup', {
    path: '/signup',
    pageTitle: 'Signup',
    errorMessage: message,
    oldInput: {
      email: '',
      password: '',
      confirmPassword: ''
    },
    validationErrors: []
  });
};

exports.postSignup = (req, res, next) => {
  const { email, password, confirmPassword } = req.body;
  const errors = validationResult(req);

  // ADDED: log what express-validator produced
  console.log('[DEBUG validation errors]', errors.array());

  if (!errors.isEmpty()) {
    console.log('[Errors Array]', errors.array());
    return res.status(422).render('auth/signup', {
      path: '/signup',
      pageTitle: 'Signup',
      errorMessage: errors.array()[0].msg,
      oldInput: { email, password, confirmPassword },
      validationErrors: errors.array()
    });
  }
      bcrypt.hash(password, 12).then(hashedPassword => {
        const user = new User({
          email,
          password: hashedPassword,
          cart: { items: [] }
        });
        return user.save();
      })
    .then(savedUser => {
      if (!savedUser) return; // we already redirected above

      // Send welcome email through Gmail SMTP (Nodemailer)
      return sendEmail({
        to: email,
        subject: 'Welcome to our shop',
        html: `<p>Hi ${email},</p><p>Thanks for signing up! 🎉</p>`,
        text: `Hi ${email},\n\nThanks for signing up!`
      }).catch(err => {
        console.log('[SIGNUP] email error (non-fatal):', err && err.message ? err.message : err);
      });
    })
    .then(() => {
      if (!res.headersSent) {
        return res.redirect('/login');
      }
    })
    .catch(err => {
      console.log('[SIGNUP] general error:', err && err.message ? err.message : err);
      if (!res.headersSent) return res.redirect('/signup');
    });
};

exports.getReset = (req, res, next) => {
  let message = req.flash('error');
  message = message.length > 0 ? message[0] : null;

  res.render('auth/reset', {
    path: '/reset',
    pageTitle: 'Reset password',
    errorMessage: message
  });
};

exports.postReset = (req, res, next) => {
  crypto.randomBytes(32, (err, buffer) => {
    if (err) {
      console.log('[RESET] crypto error:', err);
      return res.redirect('/reset');
    }

    const token = buffer.toString('hex');

    User.findOne({ email: req.body.email })
      .then(user => {
        if (!user) {
          req.flash('error', 'No account with that email found.');
          return res.redirect('/reset');
        }

        user.resetToken = token;
        user.resetTokenExpiration = Date.now() + 3600000; // 1 hour
        return user.save();
      })
      .then(saved => {
        if (!saved) return; // already redirected (no user)

        const baseUrl = getBaseUrl(req);
        const resetLink = `${baseUrl}/reset/${token}`;

        // IMPORTANT: return the promise so we wait before redirecting
        return sendEmail({
          to: req.body.email,
          subject: 'Password reset',
          html: `
            <p>You requested a password reset.</p>
            <p>Click this <a href="${resetLink}">link</a> to set a new password.</p>
            <p><small>This link is valid for 1 hour.</small></p>
          `,
          text: `You requested a password reset.\nOpen this link to set a new password:\n${resetLink}\n\nThis link is valid for 1 hour.`
        })
          .then(() => {
            if (!res.headersSent) {
              // Optional: flash info message here if you use one
              return res.redirect('/');
            }
          })
          .catch(err => {
            console.log('[RESET] email send error (non-fatal):', err && err.message ? err.message : err);
            if (!res.headersSent) return res.redirect('/');
          });
      })
      .catch(err => {
        console.log('[RESET] general error:', err);
        if (!res.headersSent) return res.redirect('/reset');
      });
  });
};

exports.getNewPassword = (req, res, next) => {

  const token = req.params.token;
  User.findOne({resetToken: token, resetTokenExpiration: {$gt: Date.now()}})
  .then(user => {
     let message = req.flash('error');
      message = message.length > 0 ? message[0] : null;
      res.render('auth/new-password', {
      path: '/new-password',
      pageTitle: 'Set New Password',
      errorMessage: message,
      userId: user._id.toString(),
      passwordToken: token
  });
  })
  .catch(err => {console.log('[NewPassword]:', err && err.message ? err.message : err)}
  )

 
}

exports.postNewPassword = (req, res, next) => {
  const newPassword = req.body.password;
  const userId = req.body.userId;
  const passwordToken = req.body.passwordToken;
  let resetUser;

  User.findOne({resetToken: passwordToken, resetTokenExpiration: {$gt: Date.now()}
  })
    .then(user => {
      resetUser = user;
      return bcrypt.hash(newPassword, 12)
    })
    .then(hashedPassword => {
      resetUser.password = hashedPassword;
      resetUser.resetToken = null;
      resetUser.resetTokenExpiration = undefined;
      return resetUser.save();
    })
    .then(result => {
      res.redirect('/login')
    })
    .catch(err => {console.log('[NewPassword]:', err && err.message ? err.message : err)}
  )
  
  }


exports.postLogout = (req, res, next) => {
  req.session.destroy(err => {
    if (err) console.log('[LOGOUT] session destroy error:', err);
    res.clearCookie('connect.sid');
    return res.redirect('/');
  });
};
