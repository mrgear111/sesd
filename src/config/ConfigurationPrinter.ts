import { Configuration } from './Configuration';

/**
 * Configuration printer
 * Formats Configuration objects into valid JSON configuration files
 */
export class ConfigurationPrinter {
  /**
   * Print configuration to JSON string
   * Ensures round-trip property: parse(print(config)) === config
   */
  print(config: Configuration): string {
    return JSON.stringify(config, null, 2);
  }

  /**
   * Print configuration to file
   */
  printToFile(config: Configuration, filePath: string): void {
    const fs = require('fs');
    fs.writeFileSync(filePath, this.print(config), 'utf-8');
  }
}
