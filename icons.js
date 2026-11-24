/* ======================================================================
   Mofit icon set — 24px grid, 1.8 stroke, round joins, ember accent layer.
   Every emoji in the UI is swapped for its drawn icon at render time.
   ====================================================================== */
const _A='class="a"'; // accent (ember) fill layer
const ICO={
  pill:`<rect x="3.5" y="8" width="17" height="8" rx="4" transform="rotate(-35 12 12)"/><path d="M9.2 8.9l5.6 6.2" /><path ${_A} d="M12.2 5.6l3.3-2.1a3.8 3.8 0 015.2 5.2l-2.1 3.3z" opacity=".0"/><circle ${_A} cx="8.2" cy="14.6" r="1.6"/>`,
  phone:`<rect x="6.5" y="2.5" width="11" height="19" rx="3"/><path d="M10.5 18.5h3"/><path ${_A} d="M10 6h4v1.5h-4z"/>`,
  flag:`<path d="M5 21V4"/><path d="M5 5c4-2 6 2 10 0 1.4-.7 2.9-.8 4-.3v8.6c-1.1-.5-2.6-.4-4 .3-4 2-6-2-10 0"/><path ${_A} d="M5 5c4-2 6 2 10 0v8c-4 2-6-2-10 0z" opacity=".35"/>`,
  gift:`<rect x="3.5" y="9" width="17" height="11.5" rx="2.5"/><path d="M12 9v11.5M3.5 13h17M12 9c-1.5-4-6-4.5-5.5-1.6.3 1.5 3 1.6 5.5 1.6zM12 9c1.5-4 6-4.5 5.5-1.6-.3 1.5-3 1.6-5.5 1.6z"/><path ${_A} d="M3.5 12h17v1H3.5z"/>`,
  home:`<path d="M3.5 11.5L12 4l8.5 7.5"/><path d="M6 10v9.5h12V10"/><path ${_A} d="M10 19.5v-5a2 2 0 014 0v5z"/>`,
  eye:`<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle ${_A} cx="12" cy="12" r="3.2"/>`,
  flame:`<path d="M12 21c-3.9 0-6.5-2.6-6.5-6.2 0-3.3 2.3-5 3.4-7.8.4 1.9 1.4 3 2.6 3.6C11.3 7.4 12.6 4.6 15.2 3c-.4 2.6.6 4.4 1.9 6.2 1 1.4 1.4 2.8 1.4 4.6C18.5 18.4 15.9 21 12 21z"/><path ${_A} d="M12 21c-1.8 0-3-1.2-3-2.9 0-1.7 1.3-2.5 2-4 .9 1.3 2.9 2.1 3.6 3.6.6 1.6-.6 3.3-2.6 3.3z"/>`,
  scale:`<path d="M12 4v16M5 20h14M7 7h10"/><path d="M7 7l-3 6a3 3 0 006 0L7 7zM17 7l-3 6a3 3 0 006 0l-3-6z"/><circle ${_A} cx="12" cy="4" r="1.6"/>`,
  plate:`<circle cx="13" cy="12" r="7"/><circle ${_A} cx="13" cy="12" r="3.2"/><path d="M3 4v5a1.5 1.5 0 003 0V4M4.5 9v11"/>`,
  watch:`<circle cx="12" cy="13.5" r="7.5"/><path d="M10 3h4M12 3v3M18.5 6.5l1.5-1.5"/><path ${_A} d="M12 13.5V9a4.5 4.5 0 014.5 4.5H12z"/>`,
  moon:`<path d="M20 14.5A8 8 0 019.5 4 8 8 0 1020 14.5z"/><path ${_A} d="M16.5 3.5l.6 1.4 1.4.6-1.4.6-.6 1.4-.6-1.4-1.4-.6 1.4-.6z"/>`,
  warn:`<path d="M10.3 4.2L2.8 17.5A2 2 0 004.5 20.5h15a2 2 0 001.7-3L13.7 4.2a2 2 0 00-3.4 0z"/><path d="M12 9.5v4"/><circle ${_A} cx="12" cy="16.8" r="1.2"/>`,
  arm:`<path d="M4 19c2-1 3.5-1.5 6-1.5 3.5 0 6.5 1.2 9 .5.8-3.2-.6-6.4-3.8-7.6-1.3-.5-2.6-.4-3.7.3L9 7.5 10 5 7.5 4 5.4 8.6c-.5 1.1-.3 2.4.6 3.2l2 1.7"/><path ${_A} d="M11.5 10.7c1.1-.7 2.4-.8 3.7-.3 1.8.7 3 2 3.5 3.6-2 .6-4.6.1-6.7-1.3z"/>`,
  swap:`<path d="M4 8h14l-3.5-3.5M20 16H6l3.5 3.5"/><circle ${_A} cx="18" cy="8" r="1.5"/>`,
  target:`<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.8"/><circle ${_A} cx="12" cy="12" r="1.8"/>`,
  camera:`<path d="M4 8h3l1.8-2.5h6.4L17 8h3a1 1 0 011 1v9a1 1 0 01-1 1H4a1 1 0 01-1-1V9a1 1 0 011-1z"/><circle ${_A} cx="12" cy="13" r="3.4"/>`,
  medical:`<path d="M12 21s-7.5-4-7.5-10V5.5L12 3l7.5 2.5V11c0 6-7.5 10-7.5 10z"/><path ${_A} d="M10.7 8h2.6v2.7H16v2.6h-2.7V16h-2.6v-2.7H8v-2.6h2.7z"/>`,
  bandage:`<rect x="2.6" y="8.3" width="18.8" height="7.4" rx="3.7" transform="rotate(-45 12 12)"/><rect ${_A} x="9.3" y="9.3" width="5.4" height="5.4" rx="1" transform="rotate(-45 12 12)"/>`,
  clipboard:`<rect x="5" y="4.5" width="14" height="16.5" rx="2"/><path d="M9 4.5V3h6v1.5M8.5 10h7M8.5 13.5h7M8.5 17h4"/><rect ${_A} x="9" y="2.5" width="6" height="3" rx="1"/>`,
  bowl:`<path d="M3 11h18a9 9 0 01-18 0z"/><path d="M8 11c0-2 1-3.5 2.5-4M12.5 11c.5-2.5 2-4 4.5-4.5"/><circle ${_A} cx="10" cy="15" r="1.3"/><circle ${_A} cx="14.5" cy="14.5" r="1"/>`,
  apple:`<path d="M12 7.5c-1.7-1.3-4.2-1.4-5.8.3-2 2.2-1.6 6.3.4 9.3 1.2 1.8 2.7 3.3 4.2 2.7.6-.2.9-.3 1.2-.3s.6.1 1.2.3c1.5.6 3-.9 4.2-2.7 2-3 2.4-7.1.4-9.3-1.6-1.7-4.1-1.6-5.8-.3z"/><path ${_A} d="M12 7.5c0-2.4 1.3-4 3.5-4.5-.1 2.3-1.4 3.9-3.5 4.5z"/>`,
  pan:`<circle cx="10" cy="12" r="6.5"/><path d="M16.3 13.5L21.5 16"/><circle ${_A} cx="10" cy="12" r="2.6"/>`,
  drumstick:`<path d="M14.5 3.5a6 6 0 016 6c0 3.4-3.2 5.5-6.5 5.5l-4 4a2 2 0 11-2.8-2.8l-.2-.2a2 2 0 112.8-2.8l4-4c0-3.3 1.3-5.7.7-5.7z"/><path ${_A} d="M15 6.5a3 3 0 013 3 3.5 3.5 0 01-3.5 3.3c.2-2.1.3-4.5.5-6.3z"/>`,
  cup:`<path d="M6 7h12l-1.4 12.2a2 2 0 01-2 1.8H9.4a2 2 0 01-2-1.8L6 7zM5 7h14M13 7l1.5-4.5H17"/><path ${_A} d="M6.8 13h10.4l-.6 6.2a2 2 0 01-2 1.8H9.4a2 2 0 01-2-1.8z"/>`,
  bread:`<path d="M5 11a4 4 0 01-1-7.9C6 2.5 8.5 2.5 12 2.5s6 0 8 .6A4 4 0 0119 11v9a1 1 0 01-1 1H6a1 1 0 01-1-1v-9z"/><path ${_A} d="M9 9.5c1 1 2 1.5 3 1.5s2-.5 3-1.5"/>`,
  pencil:`<path d="M4 20l1-4.5L15.5 5a2.1 2.1 0 013 3L8 18.5 4 20z"/><path ${_A} d="M13.6 6.9l3 3 1.9-1.9a2.1 2.1 0 00-3-3z"/>`,
  offline:`<path d="M3 3l18 18M8.5 16.5a5 5 0 017 0M5 12.5a10 10 0 015.3-2.7M14.5 9.9A10 10 0 0119 12.5M2 9a14.5 14.5 0 014.6-3M11 5.1A14.5 14.5 0 0122 9"/><circle ${_A} cx="12" cy="19.5" r="1.4"/>`,
  chat:`<path d="M4 5h16a1 1 0 011 1v10a1 1 0 01-1 1h-9l-5 4v-4H4a1 1 0 01-1-1V6a1 1 0 011-1z"/><circle ${_A} cx="8.5" cy="11" r="1.2"/><circle ${_A} cx="12" cy="11" r="1.2"/><circle ${_A} cx="15.5" cy="11" r="1.2"/>`,
  trophy:`<path d="M7 4h10v5a5 5 0 01-10 0V4zM7 6H4a3 3 0 003 4M17 6h3a3 3 0 01-3 4M12 14v3.5M8 21h8M9 21c0-2 1.3-3.5 3-3.5s3 1.5 3 3.5"/><path ${_A} d="M12 6l.9 1.8 2 .3-1.4 1.4.3 2-1.8-.9-1.8.9.3-2-1.4-1.4 2-.3z"/>`,
  battery:`<rect x="2.5" y="7" width="17" height="10" rx="2"/><path d="M21.5 10.5v3"/><rect ${_A} x="4.5" y="9" width="13" height="6" rx="1"/>`,
  batteryLow:`<rect x="2.5" y="7" width="17" height="10" rx="2"/><path d="M21.5 10.5v3"/><rect ${_A} x="4.5" y="9" width="3.5" height="6" rx="1"/>`,
  search:`<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L21 21"/><path ${_A} d="M7.5 10.5a3 3 0 013-3v-1a4 4 0 00-4 4z"/>`,
  video:`<rect x="2.5" y="5" width="19" height="14" rx="3"/><path ${_A} d="M10 8.8v6.4l5.3-3.2z"/>`,
  refresh:`<path d="M20 11a8 8 0 00-14.6-4.5M4 13a8 8 0 0014.6 4.5"/><path d="M5.5 2.5v4h4M18.5 21.5v-4h-4"/><circle ${_A} cx="12" cy="12" r="2"/>`,
  up:`<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/><circle ${_A} cx="9" cy="11" r="1.6"/>`,
  down:`<path d="M3 7l6 6 4-4 8 8"/><path d="M15 17h6v-6"/><circle ${_A} cx="9" cy="13" r="1.6"/>`,
  stop:`<circle cx="12" cy="12" r="8.5"/><path ${_A} d="M7 10.5h10v3H7z"/>`,
  bolt:`<path d="M13 2.5L4.5 13.5H11L10 21.5l8.5-11H12z"/><path ${_A} d="M13 2.5l-3 7H12z"/>`,
  dumbbell:`<path d="M7 12h10"/><rect x="3.5" y="7.5" width="3.5" height="9" rx="1"/><rect x="17" y="7.5" width="3.5" height="9" rx="1"/><path d="M2 10v4M22 10v4"/><rect ${_A} x="4.6" y="9" width="1.3" height="6" rx=".6"/><rect ${_A} x="18.1" y="9" width="1.3" height="6" rx=".6"/>`,
  box:`<path d="M3.5 7.5L12 3l8.5 4.5v9L12 21l-8.5-4.5z"/><path d="M3.5 7.5L12 12l8.5-4.5M12 12v9"/><path ${_A} d="M7.7 5.3l8.5 4.5v2.5l-8.5-4.6z"/>`,
  run:`<path d="M3 17.5h11.5c2.5 0 5 .8 6.5 2.5H3v-2.5z"/><path d="M3 17.5V12c2.5 0 4-1 5.5-3l2 1.5c1.3 1 2.4 2.5 2.8 4.3l.7 2.7"/><path ${_A} d="M8.5 9l2 1.5-1.3 1.6-2.1-1.4z"/>`,
  gear:`<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z"/><circle ${_A} cx="12" cy="12" r="1.4"/>`,
  calendar:`<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/><rect ${_A} x="13.5" y="13.5" width="3.5" height="3.5" rx=".8"/>`,
  save:`<path d="M5 3.5h11l3.5 3.5v12a1.5 1.5 0 01-1.5 1.5H5A1.5 1.5 0 013.5 19V5A1.5 1.5 0 015 3.5z"/><path d="M7.5 3.5v5h8v-5"/><rect ${_A} x="7.5" y="13" width="9" height="5" rx="1"/>`,
  hourglass:`<path d="M6 3h12M6 21h12M7 3c0 5 5 5 5 9s-5 4-5 9M17 3c0 5-5 5-5 9s5 4 5 9"/><path ${_A} d="M8.5 19.5c.6-2.3 2.4-3.3 3.5-3.3s2.9 1 3.5 3.3z"/>`,
  pause:`<circle cx="12" cy="12" r="8.5"/><rect ${_A} x="8.7" y="8" width="2.3" height="8" rx="1"/><rect ${_A} x="13" y="8" width="2.3" height="8" rx="1"/>`,
  plus:`<circle cx="12" cy="12" r="8.5"/><path ${_A} d="M10.8 7.5h2.4v3.3h3.3v2.4h-3.3v3.3h-2.4v-3.3H7.5v-2.4h3.3z"/>`,
  card:`<rect x="2.5" y="5.5" width="19" height="13" rx="2"/><path d="M2.5 10h19"/><rect ${_A} x="5.5" y="13.5" width="5" height="2" rx="1"/>`,
  brain:`<path d="M9.5 4.5a3 3 0 00-5 2.3 3 3 0 00-1 5 3 3 0 001.5 4.7 3 3 0 004.5 2.5V4.5zM14.5 4.5a3 3 0 015 2.3 3 3 0 011 5 3 3 0 01-1.5 4.7 3 3 0 01-4.5 2.5V4.5z"/><path ${_A} d="M9.5 4.5A2.5 2.5 0 0112 3a2.5 2.5 0 012.5 1.5V19a2.5 2.5 0 01-5 0z"/>`,
  doc:`<path d="M6 2.5h8l4.5 4.5v13a1.5 1.5 0 01-1.5 1.5H6A1.5 1.5 0 014.5 20V4A1.5 1.5 0 016 2.5z"/><path d="M14 2.5V7h4.5M8 12h8M8 15.5h8"/><path ${_A} d="M14 2.5V7h4.5z"/>`,
  puzzle:`<path d="M4 8h4a2 2 0 114 0h4v4a2 2 0 110 4v4H4v-4a2 2 0 100-4z"/><path ${_A} d="M12 8h4v4a2 2 0 110 4v4h-4z"/>`,
  bulb:`<path d="M9 17.5h6M10 21h4M12 3a6 6 0 00-3.5 10.9c.6.5 1 1.2 1 2V17.5h5V15.9c0-.8.4-1.5 1-2A6 6 0 0012 3z"/><path ${_A} d="M12 6.5a3 3 0 013 3h-1.5A1.5 1.5 0 0012 8z"/>`,
  slow:`<path d="M3 17a9 9 0 0118 0"/><path d="M12 17l-5-5"/><circle ${_A} cx="12" cy="17" r="2"/>`,
  book:`<path d="M4 4.5A1.5 1.5 0 015.5 3H19v15H5.5A1.5 1.5 0 004 19.5zM4 19.5A1.5 1.5 0 005.5 21H19v-3"/><path ${_A} d="M9 7h6v2.5H9z"/>`,
  star:`<path ${_A} d="M12 3l2.7 5.6 6.1.8-4.5 4.2 1.1 6-5.4-3-5.4 3 1.1-6L3.2 9.4l6.1-.8z"/><path d="M12 3l2.7 5.6 6.1.8-4.5 4.2 1.1 6-5.4-3-5.4 3 1.1-6L3.2 9.4l6.1-.8z"/>`,
  ruler:`<rect x="2" y="8" width="20" height="8" rx="1.5"/><path d="M6 8v3M10 8v4M14 8v3M18 8v4"/><rect ${_A} x="2.8" y="13.2" width="18.4" height="2" rx=".6"/>`,
  bell:`<path d="M6 16V11a6 6 0 0112 0v5l1.5 2h-15zM10 20.5a2 2 0 004 0"/><circle ${_A} cx="17.5" cy="6" r="2.5"/>`,
  mail:`<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3.5 6l8.5 7 8.5-7"/><circle ${_A} cx="19" cy="5" r="2.5"/>`,
  key:`<circle cx="8" cy="15" r="4.5"/><path d="M11.2 11.8L20 3M16.5 6.5l2.5 2.5M14 9l2 2"/><circle ${_A} cx="8" cy="15" r="1.6"/>`,
  lock:`<rect x="4.5" y="10.5" width="15" height="10.5" rx="2"/><path d="M8 10.5V7a4 4 0 018 0v3.5"/><circle ${_A} cx="12" cy="15.5" r="1.8"/>`,
  user:`<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.2 3.6-7 8-7s8 2.8 8 7"/><path ${_A} d="M8.8 6.5a3.5 3.5 0 016.4 0z"/>`,
  users:`<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 3-6 6.5-6s6.5 2.4 6.5 6"/><circle ${_A} cx="17" cy="9" r="2.8"/><path d="M17.5 14c2.4.3 4 2.2 4 5"/>`,
  compass:`<circle cx="12" cy="12" r="8.5"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/><path ${_A} d="M15.5 8.5l-2 5-3-3z"/>`,
  coins:`<ellipse cx="9" cy="7" rx="5.5" ry="2.5"/><path d="M3.5 7v5c0 1.4 2.5 2.5 5.5 2.5M3.5 12v5c0 1.4 2.5 2.5 5.5 2.5"/><ellipse ${_A} cx="15" cy="13" rx="5.5" ry="2.5"/><path d="M9.5 13v4.5c0 1.4 2.5 2.5 5.5 2.5s5.5-1.1 5.5-2.5V13"/>`,
  question:`<circle cx="12" cy="12" r="8.5"/><path d="M9.5 9.5a2.5 2.5 0 114 2c-.9.6-1.5 1.1-1.5 2.2"/><circle ${_A} cx="12" cy="16.8" r="1.2"/>`,
  layers:`<path d="M12 3l9 4.5-9 4.5-9-4.5z"/><path d="M3 12l9 4.5 9-4.5M3 16.5L12 21l9-4.5"/><path ${_A} d="M12 3l9 4.5-9 4.5z"/>`,
  printer:`<path d="M7 9V3h10v6M7 17H4.5A1.5 1.5 0 013 15.5v-5A1.5 1.5 0 014.5 9h15a1.5 1.5 0 011.5 1.5v5a1.5 1.5 0 01-1.5 1.5H17"/><rect x="7" y="14" width="10" height="7" rx="1"/><circle ${_A} cx="17.5" cy="12" r="1.1"/>`,
  leg:`<path d="M9 2.5v7.5c0 1.5.4 3 1.2 4.2L12 17l-.5 3.5H18c0-1.4-1-2.5-2.3-2.8l-1.2-.3-.4-4.4c-.2-1.6-.1-3.2.4-4.7L16 2.5"/><path ${_A} d="M9 4h6.3l-1 3.3c-.3 1-.4 2-.4 3H9.2z"/>`,
  person:`<circle cx="12" cy="4.5" r="2.2"/><path d="M12 7.5v7M12 14.5l-3 6.5M12 14.5l3 6.5M5.5 3.5L12 8l6.5-4.5"/><circle ${_A} cx="12" cy="11" r="1.6"/>`,
  dna:`<path d="M7 3c0 6 10 6 10 12s-10 3-10 6M17 3c0 6-10 6-10 12s10 3 10 6"/><path ${_A} d="M8.5 6.5h7v1.6h-7zM8.5 15.8h7v1.6h-7z"/>`,
  sparkle:`<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path ${_A} d="M18.5 15l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z"/>`,
  heart:`<path d="M12 20.5S3.5 15.5 3.5 9.3A4.8 4.8 0 0112 6.6a4.8 4.8 0 018.5 2.7c0 6.2-8.5 11.2-8.5 11.2z"/><path ${_A} d="M5.5 12h3l1.5-2.5 2.5 5 1.5-2.5h4.5"/>`,
  install:`<rect x="6" y="2.5" width="12" height="19" rx="2.5"/><path d="M12 7v7M9 11l3 3 3-3"/><circle ${_A} cx="12" cy="18.5" r="1.1"/>`,
  map:`<path d="M3 6l6-2.5 6 2.5 6-2.5v14.5L15 20.5 9 18l-6 2.5z"/><path d="M9 3.5V18M15 6v14.5"/><path ${_A} d="M9 3.5l6 2.5v14.5L9 18z"/>`,
  clock:`<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/><circle ${_A} cx="12" cy="12" r="1.4"/>`,
  drop:`<path d="M12 3s6.5 7 6.5 11.5a6.5 6.5 0 01-13 0C5.5 10 12 3 12 3z"/><path ${_A} d="M8.5 14.5a3.5 3.5 0 003.5 3.5v-1.6a1.9 1.9 0 01-1.9-1.9z"/>`,
  steps:`<path d="M6.5 13.5c-1.5 0-2.5-1.8-2.5-4.5S5 3.5 7 3.5s2.5 2.5 2.5 5-1 5-3 5z"/><path d="M15.5 20.5c-1.5 0-2.5-1.8-2.5-4.5s1-5.5 3-5.5 2.5 2.5 2.5 5-1 5-3 5z"/><rect ${_A} x="4.5" y="15" width="4.5" height="3" rx="1.4"/><rect ${_A} x="13.5" y="7.5" width="4.5" height="2" rx="1"/>`,
  bars:`<path d="M3.5 20.5h17"/><rect x="5" y="11" width="3.5" height="7" rx="1"/><rect x="10.3" y="6" width="3.5" height="12" rx="1"/><rect ${_A} x="15.6" y="3" width="3.5" height="15" rx="1"/>`,
  check:`<circle cx="12" cy="12" r="8.5"/><path ${_A} d="M12 3.5a8.5 8.5 0 018.5 8.5H12z"/><path d="M8 12.3l2.7 2.7L16 9.7"/>`,
  link:`<path d="M10 14a4 4 0 005.7 0l3-3A4 4 0 0013 5.3l-1 1M14 10a4 4 0 00-5.7 0l-3 3A4 4 0 0011 18.7l1-1"/><circle ${_A} cx="12" cy="12" r="1.3"/>`,
  trash:`<path d="M4 6.5h16M9.5 6.5V4h5v2.5M6 6.5l1 13.5h10l1-13.5"/><path ${_A} d="M10 10.5h1.5v6H10zM12.5 10.5H14v6h-1.5z"/>`,
  sprout:`<path d="M12 21v-9"/><path d="M12 12C12 7.5 9 5 4.5 5c0 4.5 3 7 7.5 7z"/><path ${_A} d="M12 14c0-4 2.7-6.5 7.5-6.5 0 4-2.7 6.5-7.5 6.5z"/>`,
  sliders:`<path d="M4 7h16M4 17h16"/><circle ${_A} cx="9" cy="7" r="2.4"/><circle ${_A} cx="15" cy="17" r="2.4"/><circle cx="9" cy="7" r="2.4"/><circle cx="15" cy="17" r="2.4"/>`,
  hand:`<path d="M8 13V5.5a1.5 1.5 0 013 0V11M11 10.5v-6a1.5 1.5 0 013 0v6M14 10.5v-4a1.5 1.5 0 013 0V14c0 4-2.5 7-6 7-2.5 0-4-1.2-5.5-3.5L3.8 15a1.6 1.6 0 012.6-1.8L8 15"/><path ${_A} d="M8 13h9v1c0 1-.1 2-.4 2.8H8.6z"/>`,
  face5:`<circle cx="12" cy="12" r="8.5"/><path ${_A} d="M7.5 13.5h9a4.5 4.5 0 01-9 0z"/><path d="M8.5 9.5l1-1 1 1M13.5 9.5l1-1 1 1"/>`,
  face4:`<circle cx="12" cy="12" r="8.5"/><path d="M8.5 14c1.8 2 5.2 2 7 0"/><circle ${_A} cx="9" cy="9.5" r="1.2"/><circle ${_A} cx="15" cy="9.5" r="1.2"/>`,
  face3:`<circle cx="12" cy="12" r="8.5"/><path d="M8.5 15h7"/><circle ${_A} cx="9" cy="9.5" r="1.2"/><circle ${_A} cx="15" cy="9.5" r="1.2"/>`,
  face2:`<circle cx="12" cy="12" r="8.5"/><path d="M9 15.5c1.6-1 4.4-1.4 6.5-.5"/><circle ${_A} cx="9" cy="9.5" r="1.2"/><circle ${_A} cx="15" cy="9.5" r="1.2"/>`,
  face1:`<circle cx="12" cy="12" r="8.5"/><path d="M8.5 16c1.8-2 5.2-2 7 0"/><circle ${_A} cx="9" cy="9.5" r="1.2"/><circle ${_A} cx="15" cy="9.5" r="1.2"/><path d="M7.5 7.5l2.5 1M16.5 7.5l-2.5 1"/>`,
  dotG:`<circle cx="12" cy="12" r="6" style="fill:#16A34A;stroke:none"/>`,
  dotY:`<circle cx="12" cy="12" r="6" style="fill:#EAB308;stroke:none"/>`,
  dotR:`<circle cx="12" cy="12" r="6" style="fill:#DC2626;stroke:none"/>`,
  dotW:`<circle cx="12" cy="12" r="5.5" style="stroke:#94A3B8"/>`,
  ext:`<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h5"/><circle ${_A} cx="20" cy="4" r="1.5"/>`,
};
const EMOJI_ICO={
  "💊":"pill","📱":"phone","🏁":"flag","🎁":"gift","🏠":"home","👁":"eye","🌙":"moon","🔒":"lock","✨":"sparkle","🌿":"sprout","🍑":"apple","🍊":"apple","🪨":"layers","🤸":"person","🙏":"heart","👇":"down","🥇":"star","🏅":"star",
  "🔥":"flame","⚖":"scale","🍽":"plate","⏱":"watch","⏰":"watch","⏳":"hourglass","😴":"moon","💤":"moon","⚠":"warn","💪":"dumbbell","⇄":"swap",
  "🎯":"target","📸":"camera","📷":"camera","🩺":"medical","⚕":"medical","🤕":"bandage","📋":"clipboard","🥗":"bowl","🍎":"apple","🍌":"apple",
  "🍳":"pan","🍗":"drumstick","🥤":"cup","🥛":"cup","🍞":"bread","📝":"pencil","✍":"pencil","✏":"pencil","✎":"pencil","📴":"offline","💬":"chat",
  "🏆":"trophy","🔋":"battery","🪫":"batteryLow","🔍":"search","🔎":"search","🎬":"video","🔄":"refresh","🔁":"refresh","📈":"up","📉":"down",
  "⛔":"stop","⚡":"bolt","🏋":"dumbbell","📦":"box","🏃":"run","⚙":"gear","📅":"calendar","🗓":"calendar","📆":"calendar","💾":"save","⏸":"pause",
  "➕":"plus","💳":"card","🤯":"brain","🧠":"brain","📄":"doc","🧩":"puzzle","💡":"bulb","🐢":"slow","📚":"book","⭐":"star","📏":"ruler","📐":"ruler",
  "🔔":"bell","📧":"mail","🔑":"key","🔐":"lock","👤":"user","🙋":"user","👥":"users","🧭":"compass","💰":"coins","🤷":"question","🧱":"layers",
  "🖨":"printer","🦵":"leg","🧍":"person","🧬":"dna","🎉":"sparkle","❤":"heart","📲":"install","🗺":"map","🕒":"clock","💧":"drop","👣":"steps",
  "📊":"bars","✅":"check","👌":"check","🔗":"link","🗑":"trash","🌱":"sprout","🎚":"sliders","👋":"_none","😍":"face5","🙂":"face4","😐":"face3",
  "😕":"face2","😞":"face1","🟢":"dotG","🟡":"dotY","🔴":"dotR","⚪":"dotW","↗":"ext","🧮":"bars","🗒":"doc",
};
const ICO_GRP={dumbbell:"train",bolt:"train",leg:"train",arm:"train",run:"train",steps:"train",hourglass:"train",slow:"train",
  apple:"food",bowl:"food",plate:"food",pan:"food",cup:"food",drumstick:"food",bread:"food",drop:"food",pill:"food",
  check:"habit",heart:"habit",battery:"habit",batteryLow:"habit",moon:"habit",sprout:"habit",watch:"habit",clock:"habit",target:"habit",
  bars:"prog",up:"prog",down:"prog",scale:"prog",camera:"prog",ruler:"prog",calendar:"prog",doc:"prog",clipboard:"prog",book:"prog",video:"prog",
  flame:"fire",bell:"fire",warn:"fire",trophy:"fire",star:"fire",sparkle:"fire",gift:"fire",
  chat:"chat",mail:"chat",phone:"chat",users:"chat",user:"chat",person:"chat",link:"chat"};
const ico=(n,cls="")=>n==="_none"?"":`<i class="ico ${cls}" data-n="${n}" data-g="${ICO_GRP[n]||""}" aria-hidden="true"><svg viewBox="0 0 24 24">${ICO[n]||""}</svg></i>`;
const _EMO_RE=new RegExp("("+Object.keys(EMOJI_ICO).sort((a,b)=>b.length-a.length).map(k=>k.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")).join("|")+")\\uFE0F?","gu");
const _SKIP={INPUT:1,TEXTAREA:1,SELECT:1,OPTION:1,SCRIPT:1,STYLE:1,svg:1,SVG:1};
function iconize(root){
  if(!root||!root.ownerDocument&&root!==document) return;
  const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:n=>{ for(let p=n.parentNode;p&&p!==root.parentNode;p=p.parentNode){ if(_SKIP[p.nodeName]) return NodeFilter.FILTER_REJECT; }
    _EMO_RE.lastIndex=0; return _EMO_RE.test(n.nodeValue)?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT; }});
  const list=[]; while(w.nextNode()) list.push(w.currentNode);
  list.forEach(n=>{ const span=document.createElement("span"); span.className="icx";
    span.innerHTML=esc(n.nodeValue).replace(_EMO_RE,(m,e)=>ico(EMOJI_ICO[e])); n.parentNode.replaceChild(span,n);
    if(span.textContent.trim()==="") span.classList.add("solo"); });
}
(function(){ let q=false; const run=()=>{ q=false; obs.disconnect(); try{ iconize(document.body); }finally{ obs.observe(document.body,{childList:true,subtree:true,characterData:true}); } };
  const obs=new MutationObserver(()=>{ if(!q){ q=true; requestAnimationFrame(run); } });
  if(document.body){ obs.observe(document.body,{childList:true,subtree:true,characterData:true}); requestAnimationFrame(run); }
  else document.addEventListener("DOMContentLoaded",()=>{ obs.observe(document.body,{childList:true,subtree:true,characterData:true}); run(); });
})();

