const Player = require("../../mongoDB/Player");

async function getDataUser(user) {
  let dataUser = await Player.findOne({ userId: user });

  if (!dataUser) {
    dataUser = new Player({
      userId: user,
      balance: 20000,
      level: 1,
      experience: 0,
      maxBet: 0,
      swag: {
        balloons: 0,
        mobile: 0,
        jamon: 0,
        paella: 0,
        guitarra: 0,
        torero: 0,
        flamenco: 0,
        siesta: 0,
        cava: 0,
        castanuelas: 0,
        sombrero: 0,
        sagradaFamilia: 0,
        soccerBall: 0,
        wine: 0,
        sol: 0,
        spanishFlag: 0,
        mate: 0,
      },
      lastWork: 0,
      lastDaily: 0,
      lastRoulette: 0,
      lastCrash: 0,
      lastRace: 0,
      lastSlot: 0,
      lastVote: 0,
      lastRussianRoulette: 0,
      votes: 1,
    });
    await dataUser.save();
  }

  return dataUser;
}

module.exports = {
  getDataUser
};
