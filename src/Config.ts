/**
 * Configuration for a grammar or configurable matcher
 */
export interface Config {

    consumeWhiteSpaceBetweenTokens: boolean;

}

export const DefaultConfig: Config = {
    consumeWhiteSpaceBetweenTokens: true,
};

export interface Configurable {

    withConfig(config: Config): this;
}
