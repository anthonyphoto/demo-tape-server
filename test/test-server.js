const chai = require("chai");
const chaiHttp = require("chai-http");

const { app, runServer, closeServer } = require("../server");

const expect = chai.expect;

chai.use(chaiHttp);

describe("Demo Tape Server", function() {
  this.timeout(5000); 
  before(function() {
    return runServer();
  });

  after(function() {
    return closeServer();
  });

  it("should retrieve Artist tracks and get SMS result", function() {
    const newReq = { artist: "Michael Jackson", phone: '2153470244' };
    return chai
      .request(app)
      .post("/demo")
      .send(newReq)
      .then(function(res) {
        expect(res).to.have.status(201);
        expect(res).to.be.json;
        expect(res.body).to.be.a("object");
        expect(res.body).to.include.keys("artistInfo", "tracks", "smsResult");
        expect(res.body.tracks).to.be.a("array");        
        expect(res.body.smsResult.status).to.not.equal(null);
      });
  });

  it("should return error if matching artist is not found", function() {
    const newReq = { artist: "_invalidArtist_", phone: '2153470245' };
    return chai
      .request(app)
      .post("/demo")
      .send(newReq)
      .catch(function(err) {
        expect(err).to.have.status(404);
        expect(err.response.body).to.deep.equal({ statusCode: 404, message: "Not Found" });
      });
    });

});
