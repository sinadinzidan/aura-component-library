import { COMMAND_HELP, normalizeAlarmId, parseCommand } from './commandParser';

describe(parseCommand.name, () => {
  it('reads an empty or blank line as nothing to do', () => {
    expect(parseCommand('')).toEqual({ kind: 'empty' });
    expect(parseCommand('   \t ')).toEqual({ kind: 'empty' });
  });

  it('parses help and its alias', () => {
    expect(parseCommand('help')).toEqual({ kind: 'help' });
    expect(parseCommand('?')).toEqual({ kind: 'help' });
  });

  it('parses clear and its alias', () => {
    expect(parseCommand('clear')).toEqual({ kind: 'clear' });
    expect(parseCommand('cls')).toEqual({ kind: 'clear' });
  });

  it('ignores case and extra spaces in verbs', () => {
    expect(parseCommand('  HELP  ')).toEqual({ kind: 'help' });
    expect(parseCommand('Show    Alarms')).toEqual({ kind: 'show-alarms', filter: 'active' });
  });

  it('parses show alarms with and without a filter', () => {
    expect(parseCommand('show alarms')).toEqual({ kind: 'show-alarms', filter: 'active' });
    expect(parseCommand('show alarms all')).toEqual({ kind: 'show-alarms', filter: 'all' });
    expect(parseCommand('show alarms ACTIVE')).toEqual({ kind: 'show-alarms', filter: 'active' });
  });

  it('parses show tags', () => {
    expect(parseCommand('show tags')).toEqual({ kind: 'show-tags' });
  });

  it('rejects show without a known subject or with an unknown filter', () => {
    const expected = { kind: 'error', message: 'Usage: show alarms [all] | show tags' };
    expect(parseCommand('show')).toEqual(expected);
    expect(parseCommand('show pumps')).toEqual(expected);
    expect(parseCommand('show alarms shelved')).toEqual(expected);
    expect(parseCommand('show tags all')).toEqual(expected);
  });

  it('parses trend and upper-cases the tag', () => {
    expect(parseCommand('trend 23-pt-92531')).toEqual({ kind: 'trend', tag: '23-PT-92531' });
  });

  it('parses goto and upper-cases the asset tag', () => {
    expect(parseCommand('goto 23-ka-9101')).toEqual({ kind: 'goto', tag: '23-KA-9101' });
  });

  it('parses ack and lower-cases the alarm id', () => {
    expect(parseCommand('ack ALM-4811')).toEqual({ kind: 'ack', alarmId: 'alm-4811' });
  });

  it('accepts an alarm by number alone', () => {
    expect(parseCommand('ack 4811')).toEqual({ kind: 'ack', alarmId: 'alm-4811' });
    expect(parseCommand('ack 12', { alarmPrefix: 'evt-' })).toEqual({ kind: 'ack', alarmId: 'evt-12' });
  });

  it.each([
    ['trend', 'Usage: trend <tag>'],
    ['trend a b', 'Usage: trend <tag>'],
    ['goto', 'Usage: goto <asset>'],
    ['goto a b', 'Usage: goto <asset>'],
    ['ack', 'Usage: ack <alarm>'],
    ['ack a b', 'Usage: ack <alarm>'],
    ['help me', 'Usage: help'],
    ['clear all', 'Usage: clear'],
  ])('explains the usage for "%s"', (input, message) => {
    expect(parseCommand(input)).toEqual({ kind: 'error', message });
  });

  it('names an unknown command as typed and points to help', () => {
    expect(parseCommand('Reboot now')).toEqual({ kind: 'error', message: 'Unknown command: Reboot. Type help for the list.' });
  });
});

describe(normalizeAlarmId.name, () => {
  it('lower-cases ids and prefixes bare numbers', () => {
    expect(normalizeAlarmId('ALM-4811')).toBe('alm-4811');
    expect(normalizeAlarmId('4811')).toBe('alm-4811');
  });
});

describe('COMMAND_HELP', () => {
  it('documents only commands the parser accepts', () => {
    for (const { usage } of COMMAND_HELP) {
      const example = usage
        .replace(' [all]', '')
        .replace('<tag>', '23-PT-92531')
        .replace('<asset>', '23-KA-9101')
        .replace('<alarm>', 'alm-4811');
      expect(parseCommand(example).kind, usage).not.toBe('error');
    }
  });
});
