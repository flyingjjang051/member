const express = require("express");
const app = express();
const dotenv = require("dotenv").config();
const path = require("path");
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
  res.render("index", { title: "main" });
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
      res.send(userID + "===" + userPW);
      //res.redirect("/");
    } else {
      res.send(`<script>alert("아이디 비밀번호 확인해주세요.");history.back();</script>`);
    }
  });
  //res.render("login");
});

app.post("/register", (req, res) => {
  const userID = req.body.userID;
  const userPW = req.body.userPW;
  const userName = req.body.userName;
  const userEmail = req.body.userEmail;
  const userZipcode = req.body.zipCode;
  const userAddress = req.body.address01 + " / " + req.body.address02;
  const userGender = req.body.gender;
  const userJob = req.body.job;
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
