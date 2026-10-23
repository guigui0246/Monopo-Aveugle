export const BAD_WHEEL = [
  'Roll the bad wheel twice more. Resolve the first new roll completely before beginning the second.',
  'Lose one randomly chosen property. If you own no property, nothing happens. Any houses on the lost property are removed.',
  'Go to jail. If you were not already in jail, roll the bad wheel again.',
  'The map changes: a non-property, non-jail tile changes its effect; two non-property tiles exchange effects and their occupants; or a connection is added or removed. Every tile keeps a usable route.',
  'Move to a random tile. Announce the tile number publicly and resolve its effect.',
  'Drop up to 100 coins on a random tile. Only the host knows where the money was dropped. The next player to land there collects it.',
  'Nothing happens.',
  'Roll the good wheel once.',
];
export const GOOD_WHEEL = [
  'Roll the bad wheel once.',
  'Nothing happens.',
  'Choose another player. Send them to jail and have them roll the bad wheel, even if they were already there.',
  'Ask the host one yes-or-no question about the game. The host must answer truthfully.',
  'Reveal your current tile and every tile you can move to. Each player has their own 30-second viewing period; play pauses until everyone finishes.',
  'Move to a Go tile and collect 200 coins. If there are several Go tiles, choose one randomly without revealing which one. If there are no Go tiles, nothing happens.',
  'Choose another player and take up to 100 coins from them.',
  'Receive 200 coins from the bank.',
];
export const ITEM_RULES = [
  [
    'Teleportation',
    'Choose any player, including yourself. Move them to a random tile and announce its number publicly.',
  ],
  [
    'Send to jail',
    'Choose another player. There is a 50% chance they are sent to jail, a 5% chance you are sent instead, and a 45% chance nothing happens.',
  ],
  [
    'Steal property',
    'Use while on a property owned by someone else. There is a 25% chance you take ownership. If successful, all houses in that property’s group return to their respective owners’ inventories; houses that do not fit are lost.',
  ],
  [
    'Move Go',
    'Relocate every Go effect to a random tile. When a destination has another effect, exchange the effects, ownership, group, and houses. Players and connections stay in place. The new Go locations are private to the host.',
  ],
  [
    'Yes-or-no question',
    'Ask the host one yes-or-no question about the game. The host must answer truthfully.',
  ],
  [
    'Reveal cells',
    'Reveal your current tile and every tile you can move to. All players must complete an individual 30-second viewing period before play resumes.',
  ],
  [
    'Steal money',
    'Choose your current tile or one connected by an outgoing path. Take 5% of the money of each other player on that tile, rounded down for each player.',
  ],
  [
    'House',
    'Use on a property you own while you own every property in its group. Add one house from your inventory. There is no limit on houses per property.',
  ],
];
