<script lang="ts">
  import { BAD_WHEEL, GOOD_WHEEL, ITEM_RULES } from '$lib/game/rulebook';
</script>

<svelte:head><title>Rules · Monopo Aveugle</title></svelte:head>
<main class="rulebook">
  <nav><a href="/">← Play</a></nav>
  <p class="badge">THE RULEBOOK</p>
  <h1>Monopo Aveugle</h1>
  <p class="muted">
    A game of property, luck, and a map only one person can see.
  </p>
  <section>
    <h2>1. The host and the players</h2>
    <p>
      Choose one host. The host runs the room, keeps the real board, answers
      questions, and does not play or take a name. Everyone else joins using the
      room’s six-digit number and a unique name. Names that differ only in
      spacing or letter case count as the same name. Choose an avatar and a
      border color to represent yourself.
    </p>
    <p>
      Your aim is to discover the hidden network while acquiring property,
      collecting rent, and managing your money and items. Only the host knows
      every player’s location. Players may keep their own private map; the host
      never gives them the complete board.
    </p>
    <p>
      Before starting, the host agrees on the game settings with everyone. The
      board must contain between five and ten tiles per player. The usual board
      has 20 tiles; players normally begin with 1,500 coins and room for three
      inventory items. Each player starts on a random tile, secretly known only
      to the host. Randomize the turn order once and keep that order for the
      rest of the game.
    </p>
  </section>
  <section>
    <h2>2. Reading the map</h2>
    <p>
      A tile’s number is its name, not its position. Tile 1 need not sit beside
      tile 2. Connections can run north, north east, east, south east, south,
      south west, west, or north west. A tile has at most one connection in each
      direction. Follow a connection in a single move, regardless of its length.
    </p>
    <p>
      A plain line is usable in both directions. An arrow is usable only in the
      direction it points. Paths may cross without joining, loop, or leave the
      board and return elsewhere. Colored routes with the same W label join
      across the board’s boundary. The movement compass shows only directions
      you can take; it never tells you the destination’s number.
    </p>
    <p>
      On the host’s board, each tile effect has a distinct color. Property has
      an effect-colored border; its shape identifies its group. Unowned
      properties are white in light mode and black in dark mode. Owned
      properties are filled with their owner’s color. Player avatars show their
      positions and have their chosen border colors.
    </p>
    <p>
      <strong>Notation:</strong> <code>xd y</code>, usually written
      <code>1d20</code>, means add the results of x dice with y sides.
      <code>&lt;+&gt;</code>
      means the good wheel, <code>&lt;-&gt;</code> the bad wheel, and
      <code>&lt;?&gt;</code> a random tile. A random tile can be any tile, including
      jail. Announce public results to everyone; share private results only with the
      host.
    </p>
  </section>
  <section>
    <h2>3. Taking a turn</h2>
    <ol>
      <li>
        If you started in jail, resolve one bad-wheel roll before doing anything
        else.
      </li>
      <li>
        You may use inventory items. If an item moves someone during this part
        of the turn, do not resolve the destination’s tile effect.
      </li>
      <li>
        Move along exactly one outgoing connection. You may follow a loop back
        to the same tile.
      </li>
      <li>
        Resolve the tile you land on. If you started the turn in jail and land
        in jail again, skip that jail effect.
      </li>
      <li>
        You may use more inventory items. If an item moves someone now, resolve
        the destination’s tile effect.
      </li>
      <li>
        End your turn. The next player in the established order takes their
        turn.
      </li>
    </ol>
    <p>
      Resolve wheel rolls and player choices before continuing. When a wheel
      calls for two new rolls, fully resolve the first before the second. A
      single chain stops after twenty nested wheel effects.
    </p>
  </section>
  <section>
    <h2>4. Tile effects</h2>
    <dl>
      <dt>Property</dt>
      <dd>
        When you arrive, everyone learns who owns the property, whether that
        owner has the whole group, and how many houses are on the tile. If it is
        unowned and you can afford it, you may buy it. If another player owns
        it, pay rent to that player. Your own property charges you nothing. The
        usual purchase price is 100 coins and the usual base rent is 50.
      </dd>
      <dt>Jail</dt>
      <dd>
        Landing in jail triggers the bad wheel, unless you started this turn in
        jail. Starting a turn in jail also triggers the bad wheel. You can still
        move out along a connection; jail always has an exit.
      </dd>
      <dt>Go</dt>
      <dd>
        Collect the host’s Go reward when you land here, normally 200 coins.
      </dd>
      <dt>Shop</dt>
      <dd>
        You may buy any item you can afford, provided your inventory has space.
        Everyone can see the catalogue and current prices.
      </dd>
      <dt>Good wheel</dt>
      <dd>
        Roll a die with eight sides and resolve the matching good-wheel outcome.
      </dd>
      <dt>Bad wheel</dt>
      <dd>
        Roll a die with eight sides and resolve the matching bad-wheel outcome.
      </dd>
      <dt>Neutral</dt>
      <dd>
        Nothing happens. If someone has dropped money here, collect it when you
        land.
      </dd>
    </dl>
    <p>
      Money dropped on any tile is collected when a player lands there, before
      the tile’s normal effect. You can never pay or lose more money than you
      have, and balances do not go below zero.
    </p>
  </section>
  <section>
    <h2>5. Properties, monopolies, and houses</h2>
    <p>
      A monopoly means owning every property in the same group. Groups are shown
      by shape: square, circle, triangle, diamond, pentagon, hexagon, and
      further polygons. The usual game has four groups of three properties.
    </p>
    <p>
      Buy a house item at a shop, then use it while standing on a property you
      own in a group you monopolize. Each house doubles that property’s base
      rent: 50, 100, 200, 400, and so on. There is no house limit. Houses in
      inventory occupy item slots; built houses do not. Losing ownership breaks
      a monopoly immediately.
    </p>
  </section>
  <section>
    <h2>6. Shopping and using items</h2>
    <p>
      Items cost money and occupy inventory slots. Each purchase increases that
      item’s price for everyone. The usual starting price is 12 coins per item,
      rising by 3 per purchase; check your room’s settings and catalogue. You
      may buy several items while at a shop if you have enough money and
      inventory space.
    </p>
    <p>
      Every used item is consumed, including an item whose chance roll fails or
      whose conditions produce no effect. Choose a valid target before using an
      item. Movement items obey the before-move and after-move timing in the
      turn sequence.
    </p>
    <dl>
      {#each ITEM_RULES as [name, rule]}<dt>{name}</dt>
        <dd>{rule}</dd>{/each}
    </dl>
  </section>
  <section>
    <h2>7. The bad wheel &lt;-&gt;</h2>
    <div class="table-scroll">
      <table>
        <thead><tr><th>1d8</th><th>Outcome</th></tr></thead><tbody
          >{#each BAD_WHEEL as rule, i}<tr><th>{i + 1}</th><td>{rule}</td></tr
            >{/each}</tbody
        >
      </table>
    </div>
  </section>
  <section>
    <h2>8. The good wheel &lt;+&gt;</h2>
    <div class="table-scroll">
      <table>
        <thead><tr><th>1d8</th><th>Outcome</th></tr></thead><tbody
          >{#each GOOD_WHEEL as rule, i}<tr><th>{i + 1}</th><td>{rule}</td></tr
            >{/each}</tbody
        >
      </table>
    </div>
  </section>
  <section>
    <h2>9. Questions and reveals</h2>
    <p>
      When granted a question, ask the host something about the game that can be
      answered yes or no. The host must answer truthfully with <strong
        >yes</strong
      >, <strong>no</strong>, <strong>I don’t know</strong>, or
      <strong>Invalid</strong>. Use Invalid when the question is not about the
      game or is not a yes-or-no question.
    </p>
    <p>
      A reveal shows the current tile and all tiles reachable in one move. Each
      player presses Start my 30 seconds to begin their own viewing window. No
      one takes game actions during the reveal. After every player’s viewing
      time has ended, resume the game and continue any waiting wheel effects.
    </p>
  </section>
  <section>
    <h2>10. Your private notebook</h2>
    <p>
      Build your own map with tile shapes, player avatars, straight lines, and
      arrows. Right-click an object, or select it and open Edit, to change its
      effect, group, owner, avatar, or color. Drag objects to move them;
      attached lines follow them. Use a plain line for a two-way path and an
      arrow for a one-way path. Your notes are private and saved on your device.
      You may export them as an SVG drawing.
    </p>
  </section>
  <section>
    <h2>11. Pausing, reconnecting, and ending</h2>
    <p>
      Players cannot newly join after the game starts. If you disconnect, return
      on the same device and browser within five minutes to reclaim your seat.
      If the host remains disconnected for five minutes, the room closes.
    </p>
    <p>
      The host may adjust shop price increases, property costs, base rent, and
      record-download permission during play. Board size, starting money, Go
      reward, property groups, and inventory capacity are fixed once play
      starts.
    </p>
    <p>
      The host ends the game after confirming twice. There is no automatic
      bankruptcy or victory trigger: agree on a finish condition together before
      play. Once the game is over, the host can download its record, and players
      can do so when the host permits it.
    </p>
  </section>
</main>
