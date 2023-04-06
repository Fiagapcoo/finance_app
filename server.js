const express = require('express');
const mysql = require('mysql');
let alert = require('alert');
const cookieParser = require('cookie-parser'); // Require cookie-parser
const app = express();
const port = 7000;

app.set('views', './views');
app.set('view engine', 'ejs');

app.use(express.urlencoded({ extended: false }));
app.use(express.static('public'));
app.use(cookieParser()); // Use cookie-parser middleware

const connection = mysql.createConnection({
  host: 'localhost',
  password: '',
  user: 'root',
  database: 'finance_app'
});

let user = {
  username: '',
  password: '',
  id: -1
};

app.get('/', (req, res) => {
    res.redirect('/home');
});

app.get('/login', (req, res) => {
  res.render('login_page');
});

app.post('/login', (req, res) => {
  user.username = req.body.username;
  user.password = req.body.password;
  if (user.username && user.password) {
    connection.query('SELECT ID FROM Users WHERE nome = ? AND pass = ?', [user.username, user.password], function(error, results, fields) {
      if (results.length > 0) {
        user.id = results[0].ID;
        res.cookie('userId', user.id); // Set cookie with user ID
        res.redirect('/home');
      } else {
        alert("Incorrect Username and/or Password!");
        res.redirect('/login');
      }
    });
  }
});

app.get('/home', (req, res) => {
  const userId = req.cookies.userId; // Get user ID from cookie
  if (userId) {
    connection.query('SELECT * FROM Users WHERE ID = ?', [userId], function(error, results, fields) {
      if (results.length > 0) {
        user.username = results[0].nome
        user.password = results[0].pass
        user.id = userId;

        res.render('home_page', { user });
      } else {
        res.redirect('/login');
      }
    });
  } else {
    res.redirect('/login');
  }
});

app.get('/less', (req, res) => {
res.render('less_page');
});
app.post('/less', (req, res) => {
    var preco = req.body.preco;
    var userId = req.cookies.userId;
    var balance = 0;
    var less = 0
    connection.query("SELECT * FROM infos_credit WHERE ID_user = ?;", [userId], function(error, results, fields) {
        if (error) throw error;
        if (results.length > 0) {
            balance = results[0].Balance;
            less = results[0].less;
        }});
        console.log(balance);
        console.log(preco);
        var newBalance = balance - preco;

        connection.query("UPDATE infos_credit SET Balance = (Balance - ?), less = (less + ?) WHERE ID_user = ?;", [preco,preco, userId], function(error, results, fields) {
            if (error) throw error;
            res.redirect('/home');
        });

    });

app.get('/more', (req, res) => {
res.render('more_page');
});
app.post('/more', (req, res) => {
    var preco = req.body.quantia;
    var userId = req.cookies.userId;
    var balance = 0;
    var less = 0
    connection.query("SELECT * FROM infos_credit WHERE ID_user = ?;", [userId], function(error, results, fields) {
        if (error) throw error;
        if (results.length > 0) {
            balance = results[0].Balance;
            less = results[0].less;
        }});
        console.log(balance);
        console.log(preco);


        connection.query("UPDATE infos_credit SET Balance = (Balance + ?), more = (more + ?) WHERE ID_user = ?;", [preco,preco, userId], function(error, results, fields) {
            if (error) throw error;
            res.redirect('/home');
        });

    });

app.get('/logout', (req, res) => {
    res.clearCookie('userId'); // Clear cookie
    res.redirect('/login');
});
app.get('/stats', (req, res) => {
    
    const userId = req.cookies.userId
    
    
    const sql = 'SELECT Balance, less AS spent, more AS won FROM infos_credit WHERE ID_user = ?';
    connection.query(sql, [userId], (error, results) => {
      if (error) {
        console.error('Error retrieving statistics:', error);
        res.render('error');
        return;
      }
      
      // Render the statistics template with the user's data
      res.render('stats_page', {
        balance: results[0].Balance,
        spent: results[0].spent,
        won: results[0].won
      });
    });
  });

app.get('/clear', (req, res) => {
    const userId = req.cookies.userId;

    connection.query("UPDATE infos_credit SET Balance = 0, less = 0, more = 0 WHERE ID_user = ?;", [userId], function(error, results, fields) {
        if (error) throw error;
        res.redirect('/stats');
    });

});
  
  
  
app.get('/register', (req, res) => {
  res.render('register_page');
});
app.post('/register', (req, res) => {
var username = req.body.username;
var password = req.body.password;
var email = req.body.email;

if (username && password && email) {
    connection.query("INSERT INTO Users (ID,nome, pass, email) VALUES (NULL,?, ?, ?)", [username, password, email], function(error, results, fields) {
        if (error) throw error;
        connection.query('SELECT ID FROM Users WHERE nome = ? AND pass = ?', [username, password], function(error, results, fields) {
            if (results.length > 0) {
                user.id = results[0].ID;
                connection.query("INSERT INTO infos_credit (Balance,less,more,ID_user) VALUES ('0','0','0',?)", [user.id], function(error, results, fields) {
                    if (error) throw error;
                    res.redirect('/home');
                });
            } else {
                alert("Incorrect Username and/or Password!");
                res.redirect('/login');
            }
        });
    });

}else{
    alert("Por favor preencha todos os campos!");
    res.redirect('/register');
}

});
  
  
  

app.listen(port, '192.168.1.76', () => {
    console.log(`Server running at http://192.168.1.76:${port}/`);
  });
