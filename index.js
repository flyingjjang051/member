const express = require("express");
const app = express();
const dotenv = require("dotenv").config();
const path = require("path");

// session처리용...
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const session = require("express-session");
const { copyFileSync } = require("fs");
const { serialize } = require("v8");

app.use(
  session({
    secret: "비밀코드는아무거나",
    resave: true, // 강제로 재 저장하겠느냐....
    saveUninitialized: false, // 빈값을 저장하겠느냐
    cookie: { maxAge: 1000 * 60 * 60 }, // milli second로 시간 설정
  })
);
app.use(passport.initialize());
app.use(passport.session());

passport.use(
  new LocalStrategy(
    {
      usernameField: "userID", // 속성중에 name속성으로 찾아서쓰면 된다. id랑 전혀 관계 없다.
      passwordField: "userPW",
      session: true,
      passReqToCallback: false,
    },
    (id, password, done) => {
      console.log(id, "====", password);
      db.collection("member").findOne({ userID: id }, (err, result) => {
        if (err) {
          return done(err);
        }
        if (!result) {
          return done(null, false, { message: "존재하지 않는 아이디 입니다." });
        }
        if (result) {
          if (password === result.userPW) {
            console.log("로그인 성공");
            return done(null, result);
          } else {
            console.log("로그인 실패");
            return done(null, false, { message: "password를 확인해주세요." });
          }
        }
      });
    }
  )
);

// 직렬화
passport.serializeUser((user, done) => {
  //console.log("serializeUser===", user);
  done(null, user.userID);
});

// 직렬화
passport.deserializeUser((id, done) => {
  db.collection("member").findOne({ userID: id }, (err, result) => {
    done(null, result);
  });
});

const MongoClient = require("mongodb").MongoClient;
let db = null;
MongoClient.connect(process.env.MONGO_URL, { useUnifiedTopology: true }, (err, client) => {
  if (err) {
    console.log(err);
  }
  db = client.db("crudapp");
});

app.set("port", process.env.PORT || 8099);
const PORT = app.get("port");
console.log(__dirname);
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "/public")));
app.get("/", (req, res) => {
  res.render("index", { title: "main", userInfo: req.user });
});
app.get("/join", (req, res) => {
  res.render("join", { title: "join" });
});
app.get("/register", (req, res) => {
  res.send(`아이디는 ${req.query.userID}==패스워드는 ${req.query.userPW}`);
});
app.get("/login", (req, res) => {
  res.render("login", { title: "login" });
});
app.get("/logout", (req, res) => {
  if (req.user) {
    req.session.destroy();
    //res.redirect("/");
    res.send(`<script>alert("로그아웃되었습니다."); location.href="/"</script>`);
  }
});

app.get("/delete", (req, res) => {
  res.render("delete", { title: "Member Delete" });
});
app.post("/delete", (req, res) => {
  console.log(req.user.userID);
  const userPW = req.body.userPW;
  db.collection("member").deleteOne({ userID: req.user.userID, userPW: userPW }, (err, result) => {
    console.log(result);
    if (result.deletedCount > 0) {
      res.send(`<script>alert("회원탈퇴 되었습니다.");location.href="/"</script>`);
    } else {
      res.send(`<script>alert("비밀번호 확인해주세요.");location.href="/delete";</script>`);
    }
  });
});

app.get("/mypage", isLogged, (req, res) => {
  //console.log(req.user);
  res.render("mypage", { title: "mypage", userInfo: req.user });
});

app.get("/modify", isLogged, (req, res) => {
  //console.log(req.user);
  res.render("modify", { title: "modify", userInfo: req.user });
});
app.post("/modify", (req, res) => {
  // join 이랑 똑같은 로직을 탄다.
  // 대신 insertOne updateOne을 쓴다.
  // 이떄 패스워드가 같아야지만 update를 해준다.
  const userID = req.body.userID;
  const userPW = req.body.userPW;
  const userName = req.body.userName;
  const userEmail = req.body.userEmail;
  const userZipcode = req.body.userZipcode;
  const userAddress = req.body.address01 + "/" + req.body.address02;
  const userGender = req.body.gender;
  const userJob = req.body.job;
  db.collection("member").updateOne(
    { userID: userID },
    { $set: { userPW: userPW, userName: userName, userEmail: userEmail, userZipcode: userZipcode, userAddress: userAddress, userGender: userGender, userJob: userJob } },
    (err, result) => {
      if (err) {
        console.log(err);
      }
      console.log(result);
      res.send(`<script>alert("회원정보 수정이 되었습니다.");location.href="/";</script>`);
    }
  );
});

// 미들웨어 얘는 마지막에 무조건 next 있어야 함.
function isLogged(req, res, next) {
  if (req.user) {
    next(); // next()안적으면 다음 단계로 못들어감...
  } else {
    res.send(`<script>alert("로그인 먼저 하세요."); location.href="/login"</script>`);
  }
}

/*
app.post("/login", (req, res) => {
  console.log(req);
  const userID = req.body.userID;
  const userPW = req.body.userPW;
  // 여기에 db에가서 member collection에 가서 id pw비교해서 있으면 로그인 되었다고 처리
  db.collection("member").findOne({ userID: userID, userPW: userPW }, (err, result) => {
    if (err) {
      console.log(err);
    }
    if (result !== null) {
      //res.send(userID + "===" + userPW);
      res.redirect("/");
    } else {
      res.send(`<script>alert("아이디 비밀번호 확인해주세요.");history.back();</script>`);
    }
  });
  //res.render("login");
});
*/
app.post("/login", passport.authenticate("local", { failureRedirect: "/login", successRedirect: "/" }));

app.post("/register", (req, res) => {
  const userID = req.body.userID;
  const userPW = req.body.userPW;
  const userName = req.body.userName;
  const userEmail = req.body.userEmail;
  const userZipcode = req.body.zipCode;
  const userAddress = req.body.address01 + " / " + req.body.address02;
  const userGender = req.body.gender;
  const userJob = req.body.job;
  // 넘어온 값은 서버에서 처리하기...
  console.log(userID);
  console.log(userPW);
  console.log(userName);
  console.log(userEmail);
  console.log(userZipcode);
  console.log(userAddress);
  console.log(userGender);
  console.log(userJob);
  const insertData = {
    userID: userID,
    userPW: userPW,
    userName: userName,
    userEmail: userEmail,
    userZipcode: userZipcode,
    userAddress: userAddress,
    userGender: userGender,
    userJob: userJob,
  };
  db.collection("member").insertOne(insertData, (err, result) => {
    if (err) {
      console.log(err);
      res.send(`<script>alert("알 수 없는 오류로 회원가입이 되지 않았습니다. 잠시후 다시 가입해 주세요"); location.href="/"</script>`);
    }
    //res.redirect("/login");
    //res.send(`<script>alert("회원가입이 잘 되었습니다.");location.href="/login"</script>`);
    //res.render("registerSuccess", { title: "success" });
    res.redirect("/success");
  });
  //res.send(`아이디는 ${req.body.userID}==패스워드는 ${req.body.userPW}`);
});
app.get("/success", (req, res) => {
  res.render("registerSuccess", { title: "success" });
});
app.post("/registerAjax", (req, res) => {
  const userID = req.body.userID;
  const userPW = req.body.userPW;
  console.log(userID);
  console.log(userPW);
  db.collection("member").insertOne({ userID: userID, userPW: userPW }, (err, result) => {
    if (err) {
      console.log(err);
      res.send(`<script>alert("알 수 없는 오류로 회원가입이 되지 않았습니다. 잠시후 다시 가입해 주세요"); location.href="/"</script>`);
    }
    res.json({ isJoin: true });
  });
  //res.send(`아이디는 ${req.body.userID}==패스워드는 ${req.body.userPW}`);
});
app.post("/idCheck", (req, res) => {
  const userID = req.body.userID;
  db.collection("member").findOne({ userID: userID }, (err, result) => {
    //console.log(result);
    if (result === null) {
      res.json({ isOk: true });
    } else {
      res.json({ isOk: false });
    }
  });
});
app.listen(PORT, () => {
  console.log(`${PORT}에서 서버 대기중`);
});
