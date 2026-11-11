import { filterCommands, matchCommand, pushHistory } from './commands';

const COMMANDS = [
  { id: 'status', text: 'status plant', keywords: ['overview'] },
  { id: 'trend', text: 'trend 23-PT-92531 24h', keywords: ['pressure'] },
  { id: 'alarms', text: 'alarms open' },
];

describe('matchCommand', () => {
  it('finds an exact match whatever the case', () => {
    expect(matchCommand('Alarms Open', COMMANDS)?.id).toBe('alarms');
  });

  it('finds a command from the start of its text', () => {
    expect(matchCommand('tre', COMMANDS)?.id).toBe('trend');
  });

  it('finds a command by keyword', () => {
    expect(matchCommand('show pressure', COMMANDS)?.id).toBe('trend');
  });

  it('returns nothing for empty or unrelated input', () => {
    expect(matchCommand('   ', COMMANDS)).toBeUndefined();
    expect(matchCommand('reboot', COMMANDS)).toBeUndefined();
  });
});

describe('filterCommands', () => {
  it('lists everything for empty input', () => {
    expect(filterCommands('', COMMANDS)).toHaveLength(3);
  });

  it('keeps commands that contain the text', () => {
    expect(filterCommands('open', COMMANDS).map((command) => command.id)).toEqual(['alarms']);
  });
});

describe('pushHistory', () => {
  it('puts the newest run first and trims the list', () => {
    const history = [
      { id: 'b', text: 'b', at: 2 },
      { id: 'a', text: 'a', at: 1 },
    ];
    expect(pushHistory(history, { id: 'c', text: 'c', at: 3 }, 2).map((entry) => entry.id)).toEqual(['c', 'b']);
  });
});
