const fs = require('fs');

function replaceChannelName(filePath, regex, replacement) {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(regex, replacement);
  fs.writeFileSync(filePath, content);
}

replaceChannelName(
  'src/pages/session/ActiveSessionPage.tsx',
  /.channel\(`session-\$\{id\}`\)/g,
  '.channel(`session-${id}-${Math.random()}`)'
);

replaceChannelName(
  'src/hooks/useSessionTests.ts',
  /.channel\(`session_tests_realtime_\$\{sessionId\}`\)/g,
  '.channel(`session_tests_realtime_${sessionId}_${Math.random()}`)'
);

replaceChannelName(
  'src/hooks/useSessionCharacters.ts',
  /.channel\(`session_characters_\$\{sessionId\}`\)/g,
  '.channel(`session_characters_${sessionId}_${Math.random()}`)'
);

replaceChannelName(
  'src/hooks/useSessionTrades.ts',
  /.channel\(`session_trades_realtime_\$\{sessionId\}`\)/g,
  '.channel(`session_trades_realtime_${sessionId}_${Math.random()}`)'
);
