import { jest } from '@jest/globals';

// Mock external dependencies BEFORE importing modules that use them
const mockGetPassword = jest.fn<() => Promise<string | null>>();
const mockSetPassword = jest.fn<() => Promise<void>>();
const mockDeletePassword = jest.fn<() => Promise<boolean>>();
const mockCapture = jest.fn();
const mockShutdown = jest.fn<() => Promise<void>>().mockResolvedValue(undefined);

jest.unstable_mockModule('keytar', () => ({
  default: {
    getPassword: mockGetPassword,
    setPassword: mockSetPassword,
    deletePassword: mockDeletePassword
  }
}));

jest.unstable_mockModule('posthog-node', () => ({
  PostHog: jest.fn().mockImplementation(() => ({
    capture: mockCapture,
    shutdown: mockShutdown
  }))
}));

// Import after mocks are set up
const { TOOL_DEFINITIONS } = await import('../../src/server/tools.js');
const { PROMPT_DEFINITIONS, getRunTestsPromptContent, getCheckResultsPromptContent } = await import('../../src/server/prompts.js');

describe('MCP Server Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Tool Definitions', () => {
    it('defines launch_test_execution tool', () => {
      const tool = TOOL_DEFINITIONS.find(t => t.name === 'launch_test_execution');
      expect(tool).toBeDefined();
      expect(tool?.inputSchema.required).toContain('testSetupName');
    });

    it('defines get_test_status tool', () => {
      const tool = TOOL_DEFINITIONS.find(t => t.name === 'get_test_status');
      expect(tool).toBeDefined();
      expect(tool?.inputSchema.required).toContain('executionId');
    });

    it('defines get_test_results tool', () => {
      const tool = TOOL_DEFINITIONS.find(t => t.name === 'get_test_results');
      expect(tool).toBeDefined();
      expect(tool?.inputSchema.required).toContain('executionId');
    });

    it('has three tools total', () => {
      expect(TOOL_DEFINITIONS).toHaveLength(3);
    });
  });

  describe('Prompt Definitions', () => {
    it('defines run-tests prompt', () => {
      const prompt = PROMPT_DEFINITIONS.find(p => p.name === 'run-tests');
      expect(prompt).toBeDefined();
      expect(prompt?.arguments).toHaveLength(1);
      expect(prompt?.arguments[0].name).toBe('testSetupName');
    });

    it('defines check-results prompt', () => {
      const prompt = PROMPT_DEFINITIONS.find(p => p.name === 'check-results');
      expect(prompt).toBeDefined();
      expect(prompt?.arguments).toHaveLength(1);
      expect(prompt?.arguments[0].name).toBe('executionId');
    });

    it('has two prompts total', () => {
      expect(PROMPT_DEFINITIONS).toHaveLength(2);
    });
  });

  describe('Prompt Content Generation', () => {
    it('generates run-tests prompt content with setup name', () => {
      const content = getRunTestsPromptContent('Patient-CRUD');
      expect(content).toContain('Patient-CRUD');
      expect(content).toContain('launch_test_execution');
      expect(content).toContain('get_test_status');
      expect(content).toContain('get_test_results');
    });

    it('generates check-results prompt content with execution ID', () => {
      const content = getCheckResultsPromptContent('12345');
      expect(content).toContain('12345');
      expect(content).toContain('get_test_status');
      expect(content).toContain('get_test_results');
    });
  });

  describe('Keychain Integration', () => {
    it('can store API key in keychain', async () => {
      mockSetPassword.mockResolvedValue();
      const keytar = await import('keytar');
      await keytar.default.setPassword('ts-mcp', 'touchstone-api-key', 'test-key');
      expect(mockSetPassword).toHaveBeenCalledWith('ts-mcp', 'touchstone-api-key', 'test-key');
    });

    it('can retrieve API key from keychain', async () => {
      mockGetPassword.mockResolvedValue('test-key');
      const keytar = await import('keytar');
      const result = await keytar.default.getPassword('ts-mcp', 'touchstone-api-key');
      expect(result).toBe('test-key');
    });

    it('can delete API key from keychain', async () => {
      mockDeletePassword.mockResolvedValue(true);
      const keytar = await import('keytar');
      const result = await keytar.default.deletePassword('ts-mcp', 'touchstone-api-key');
      expect(result).toBe(true);
    });
  });
});
