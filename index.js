const express = require('express')
const app = express()
const port = process.env.PORT || 3000
const ValorantAPI = require("unofficial-valorant-api")
const path = require("path");
const { isArgumentsObject } = require('util/types');

app.set('view engine', 'ejs')
app.use(express.static(__dirname + '/views'));

async function fetchAccount(name, tag) {
    account = await ValorantAPI.getAccount(name, tag,)
    // console.log(account)
    return account
}

async function fetchMMR(name, tag, region) {
    mmr = await ValorantAPI.getMMR("v2", region, name, tag)
    // console.log(mmr)
    return mmr
}

async function fetchMatches(name, tag, region) {
    matches = await ValorantAPI.getMatches(region, name, tag)
    // console.log(matches)
    return matches
}

function timeSince(timestamp) {
    var timeago = new Date(timestamp * 1000 + lastmatch["metadata"]["game_length"])
    var now = new Date(),
        secondsPast = (now.getTime() - timeago.getTime()) / 1000;
    if (secondsPast < 60) {
        return parseInt(secondsPast) + 's ago';
    }
    if (secondsPast < 3600) {
        return parseInt(secondsPast / 60) + 'm ago';
    }
    if (secondsPast <= 86400) {
        return parseInt(secondsPast / 3600) + 'h ago';
    }
    if (secondsPast > 86400) {
        return parseInt(secondsPast / 86400) + 'd ago';
    }
    day = timeago.getDate();
    month = timeago.toDateString().match(/ [a-zA-Z]*/)[0].replace(" ", "");
    year = timeago.getFullYear() == now.getFullYear() ? "" : " " + timeago.getFullYear();
    return day + " " + month + "" + year;
}

app.get('/', (req, res) => {
    res.send("No Player Name or Tag Provided: {Name}${Tag}")
})

app.listen(port, () => {
    console.log(`Valorant Tracker listening on port ${port}`)
})

app.get('/:player', async (req, res) => {
    split = req.params.player.split("$")
    if (split.length == 2) {
        account = await fetchAccount(split[0], split[1])
        mmr = await fetchMMR(split[0], split[1], account["data"]["region"])
        matches = await fetchMatches(split[0], split[1], account["data"]["region"])
        if (account["status"] == 200 && mmr["status"] == 200 && matches["status"] == 200) {
            season = mmr["data"]["by_season"][Object.keys(mmr["data"]["by_season"])[0]]
            mmr_ranking = mmr["data"]["current_data"]["ranking_in_tier"]
            mmr_change = mmr["data"]["current_data"]["mmr_change_to_last_game"]
            if (mmr_change != null) {
                if ((!((mmr_change).toString().startsWith("-")))) {
                    mmr_change = "+" + mmr_change
                }
            }
            lastmatch = matches["data"][0]
            lastmatch["players"]["all_players"].sort(function (a, b) {
                return b["stats"]["score"] - a["stats"]["score"]
            })
            for (i = 0; i < lastmatch["players"]["all_players"].length; i++) {
                player = lastmatch["players"]["all_players"][i]
                if (player["name"] == split[0] && player["tag"] == split[1]) {
                    position = i + 1
                    kills = player["stats"]["kills"]
                    deaths = player["stats"]["deaths"]
                    assists = player["stats"]["assists"]
                    agent = player["assets"]["agent"]["full"]
                    agent = agent.substring(0, agent.length - 4) + "v2.png"
                }
            }
            playeramount = lastmatch["players"]["all_players"].length
            rank = `https://media.valorant-api.com/competitivetiers/e4e9a692-288f-63ca-7835-16fbf6234fda/${mmr["data"]["current_data"]["currenttier"]}/largeicon.png`
            res.render('index', { rank: rank, account: account, season: season, lastmatch: lastmatch, timeSince: timeSince(lastmatch["metadata"]["game_start"]), duration: Math.round(lastmatch["metadata"]["game_length"] / 60000), kills: kills, deaths: deaths, assists: assists, agent: agent, mmr_ranking: mmr_ranking, mmr_change: mmr_change, playeramount: playeramount, position: position })
        } else {
            //res.send(`<p>Invalid Player User or API Limit<p><br>Error account:${JSON.stringify(account)}<br>Error mmr:${JSON.stringify(mmr)}<br>Error matches:${JSON.stringify(matches)}<script>setInterval(function () {location.reload();}, 15000);</script>`)
            //console.log("Invalid Player User or API Limit/Error")
        }
    } else {
        res.send("No or Wrong Player Name or Tag Provided: {Name}${Tag}")
    }
})
