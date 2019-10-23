<script>
  export let name;
  let slides = [];
  let sweeping = false;
  let channelID = window.document.location.hash.substr(1);
  let role = "";
  $: seconds = 0;
  $: stopwatchState = sweeping ? "pause" : "start";

  let sweep = setInterval(function() {
    if (sweeping) {
      seconds += 1;
    }
  }, 1000);

  function handleClick(i) {
    let newSelected = parseInt(i);
    if (connection) {
      var data = {
        cmd: "tap",
        slide: newSelected
      };
      connection.send(JSON.stringify(data));
    }
  }

  function handleReset() {
    sweeping = false;
    seconds = 0;
  }

  function handleStartStop() {
    sweeping = !sweeping;
  }

  function handleNewTalk() {
    let randomID = String(Math.round(Math.random() * 1000000000)).substr(0, 6);
    history.replaceState(null, null, " ");
    location = `#${randomID}`;
    location.reload();
  }

  function handleHome() {
    let home = `${location.origin}${location.pathname}`;
    history.replaceState(null, null, " ");
    location = home;
    location.reload();
  }

  function handleOpen() {
    history.replaceState(null, null, " ");
    let talkID = prompt("Please enter the six-digit channel ID", "");
    let talkURL = `${location.origin}${location.pathname}#${talkID}`;
    location = talkURL;
    location.reload();
  }

  String.prototype.toHHMMSS = function() {
    var sec_num = parseInt(this, 10); // don't forget the second param
    var hours = Math.floor(sec_num / 3600);
    var minutes = Math.floor((sec_num - hours * 3600) / 60);
    var seconds = sec_num - hours * 3600 - minutes * 60;

    if (hours < 10) {
      hours = "0" + hours;
    }
    if (minutes < 10) {
      minutes = "0" + minutes;
    }
    if (seconds < 10) {
      seconds = "0" + seconds;
    }
    return hours + ":" + minutes + ":" + seconds;
  };

  // WEB SOCKET STUFF

  // const url = "wss://renefournier.com/wak/ws";
  let host = "ws://localhost:2424";
  host = "wss://renefournier.com/clicker/ws";

  const url = `${host}?channel=${encodeURIComponent(channelID)}`;
  // console.log(url);
  let now;

  if (channelID) {
    window.connection = new WebSocket(url);

    connection.onopen = () => {
      now = new Date();
      let ping = setInterval(() => {
        // console.log(`Ping ${new Date()}`);
        var data = {
          cmd: "ping"
        };
        connection.send(JSON.stringify(data));
      }, 15000);
    };
    connection.onclose = e => {
      let elapsed = (new Date() - now) / 1000;
      console.log(
        `xxx WebSocket closed: ${JSON.stringify(e)} after ${elapsed} seconds`
      );
      setTimeout(function() {
        location.reload();
      }, 2000);
    };

    connection.onerror = error => {
      console.log(`!!! WebSocket error: ${JSON.stringify(error)}`);
    };

    connection.onmessage = e => {
      const data = JSON.parse(e.data);
      console.log("-->", data);

      switch (
        data.cmd // COMMAND TYPE
      ) {
        default:
          console.log(" -- ?? --");
          break;
        case "state":
          role = data.role;
          slides = data.state;
          break;
      }
    };
  }

  // if (!process.env.NODE_ENV || process.env.NODE_ENV === "development") {
  //   alert("d");
  // } else {
  //   alert("p");
  // }
</script>

<style lang="postcss">
  .clock,
  .buttons {
    height: calc(20% - 2px);
    overflow: hidden;

    background-color: rgba(255, 255, 255, 0.15);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .clock {
    background-color: rgba(255, 255, 255, 0.15);
    box-shadow: inset 0 0 4vh 2vh rgba(0, 0, 0, 0.25);
  }

  .clock.pause {
    box-shadow: inset 0 0 4vh 2vh rgba(0, 0, 0, 0.15);
    transition: box-shadow 0.25s ease;
  }

  .role {
    position: absolute;
    top: 0.5vh;
    left: 1vh;
    font-size: 12px;
    text-align: center;
    margin: 0 auto;
    color: rgba(255, 255, 255, 0.2);
  }

  .channel_id {
    position: absolute;
    top: 0.5vh;
    right: 1vh;
    font-size: 12px;
    text-align: center;
    margin: 0 auto;
    color: rgba(255, 255, 255, 0.2);
  }

  .time {
    position: relative;
    top: 3.5vh;
    font-family: "Roboto Mono", monospace;

    font-size: 8vh;
    text-align: center;
    vvertical-align: middle;
    color: rgba(255, 255, 255, 0.25);
  }

  .time.start {
    color: rgba(255, 255, 255, 0.25);
    text-shadow: 0 0 3vh rgba(0, 0, 0, 0.25);
    transition: color 0.25s ease, text-shadow 0.25s ease;
  }

  .time.pause {
    color: rgba(255, 255, 255, 0.9);
    text-shadow: 0 0 6vh rgba(255, 255, 255, 0.5);
    transition: color 0.25s ease, text-shadow 0.25s ease;
  }

  .buttons {
    text-align: center;
    background-color: rgba(255, 255, 255, 0.25);
  }

  .buttonsContainer {
    margin-top: 3.5vh;
  }

  .grid {
    height: calc(60% - 0px);
    display: flex; /* establish flex container */
    flex-wrap: wrap; /* enable flex items to wrap */
    justify-content: space-around;
  }

  .cell {
    flex: calc(33% - (3px * 5)); /* don't grow, don't shrink, width */
    font-family: "Roboto Mono", monospace;

    font-size: 6vh;
    padding-top: 1vh;
    text-align: center;
    vertical-align: middle;
    color: rgba(255, 255, 255, 0.5);
    background-color: rgba(255, 255, 255, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.05);
    transition: color 0.25s ease, background-color 0.25s ease,
      font-size 0.25s ease;
    user-select: none;
  }

  .cell.selected {
    color: rgba(255, 255, 255, 0.75);
    background-color: rgba(255, 255, 255, 0.1);
    transition: color 0.25s ease, background-color 0.25s ease,
      font-size 0.25s ease;
  }

  .cell:hover {
    cursor: pointer;
    ccolor: rgba(255, 255, 255, 0.63);
    bbackground-color: rgba(255, 255, 255, 0.15);
    ttransition: color 0.25s ease, background-color 0.25s ease,
      font-size 0.25s ease;
  }

  .button {
    font-family: "Roboto Mono", monospace;
    font-size: 4vh;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.8);
    background-color: rgb(92, 92, 92, 1);
    border: 2px solid rgba(255, 255, 255, 0.15);
    padding: 2vh 2.8vh 1.8vh;
    margin: auto 0.5vh;
    border-radius: 50rem;
    box-shadow: 0 1vh 3vh 0 rgba(0, 0, 0, 0.25);
  }

  .button:hover {
    cursor: pointer;
    color: rgba(255, 255, 255, 0.95);
    transition: color 0.25s ease, background-color 0.25s ease,
      font-size 0.25s ease, margin-top 0.25s ease, box-shadow 0.25s ease;
  }

  .button:active {
    box-shadow: 0 0.25vh 0.5vh 0 rgba(0, 0, 0, 0.5);
    transition: color 0.15s ease, background-color 0.15s ease,
      font-size 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease;
  }

  .button.pause {
    box-shadow: 0 0.25vh 0.5vh 0 rgba(0, 0, 0, 0.5);
    transition: color 0.15s ease, background-color 0.15s ease,
      font-size 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease;
  }

  .startstop,
  .reset {
    z-index: 10000;
    wwidth: 30%;
    display: inline-block;
    text-align: center;
  }

  .reset {
    background-color: rgb(128, 128, 128, 1);
  }

  .startstop.start {
    background-color: green;
  }

  .startstop.pause {
    background-color: red;
  }
</style>

{#if !channelID}
  <div class="main">
    <div style="float:right;">
      <button on:click={handleNewTalk}>NEW TALK</button>
    </div>

    <h1 class="brand">Clicker!</h1>
    <h3>The problem</h3>
    <p>
      When giving a talk containing slides, it’s often challenging for the
      speaker to direct the brother on console to advance to the next slide—or
      to a particular slide. And when the brother on console does display the
      desired slide, it’s not always obvious to the speaker that the slide is
      now on-screen. This coordination between speaker and console can be
      awkward and, more importantly, distracting to the audience. That’s where
      Clicker comes in.
    </p>
    <img src="clicker.png" alt="Clicker" style="float:right; padding: 20px" />
    <h3>What Clicker does</h3>
    <p>
      Clicker lets the speaker communicate to the brother on console which slide
      to present. Clicker also informs the speaker exactly when the slide is
      on-screen.
    </p>
    <h3>How Clicker works</h3>
    <p>
      The speaker visits
      <strong>
        <a href="https://renefournier.com/clicker">
          https://renefournier.com/clicker
        </a>
      </strong>
      and clicks the
      <strong>New Talk</strong>
      button. The Clicker interface appears. Note the six-digit channel ID at
      the top-right. The speaker asks the console brother to visit
      <a href="https://renefournier.com/clicker">
        https://renefournier.com/clicker
      </a>
      , click NEW TALK, click the Open Link button at the bottom-right, enter
      the channel ID and click OK. Now the brother on console is linked to the
      speaker. When the speaker taps slide 4, slide 4 lights up on the console
      brother’s phone. The brother on console displays slide 4, then taps 4
      again—and now a checkmark appears beside the 4.
    </p>
    <h3>One more thing...</h3>
    <p>
      Sometimes, when delivering a talk a different Kingdom Hall, I’ve found the
      lectern to be missing timer or stopwatch. So, a simple stopwatch is
      included in Clicker.
    </p>
  </div>
{:else}
  <div class="clock {stopwatchState} ">
    <div class="role">
      <span>{role.toUpperCase()}</span>
    </div>

    <div class="channel_id">
      Channel ID
      <strong>{channelID}</strong>
    </div>
    <div class="time {stopwatchState}">{String(seconds).toHHMMSS()}</div>
  </div>
  <div class="grid">
    {#each slides as slide, i}
      <div
        class="cell {slide.s ? 'selected' : ''}"
        on:click={() => handleClick(i + 1)}>
        {@html slide.p ? '<span class="fa fa-check brand"></span>' : i + 1}
      </div>
    {/each}
  </div>
  <div class="buttons">
    <div class="buttonsContainer">
      <button class="button" on:click={() => handleHome()}>
        <span class="fa fa-home" />
      </button>
      <button
        class="startstop button {stopwatchState}"
        on:click={() => handleStartStop()}>
        {#if stopwatchState === 'start'}
          <span class="fa fa-play" />
        {:else}
          <span class="fa fa-pause" />
        {/if}
      </button>
      <button class="reset button" on:click={() => handleReset()}>
        <span class="fa fa-undo" />
      </button>
      <button class="button" on:click={() => handleOpen()}>
        <span class="fa fa-external-link" />
      </button>

    </div>
  </div>
{/if}
