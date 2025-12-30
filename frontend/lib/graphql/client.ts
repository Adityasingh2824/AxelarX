/**
 * GraphQL Client for Linera Protocol
 * Handles all GraphQL queries and mutations for contract interactions
 */

export interface GraphQLResponse<T = any> {
  data?: T;
  errors?: Array<{
    message: string;
    path?: string[];
    extensions?: any;
  }>;
}

export interface GraphQLRequest {
  query: string;
  variables?: Record<string, any>;
  operationName?: string;
}

export class GraphQLClient {
  private endpoint: string;
  private headers: Record<string, string>;

  constructor(endpoint: string, headers: Record<string, string> = {}) {
    this.endpoint = endpoint;
    this.headers = {
      'Content-Type': 'application/json',
      ...headers,
    };
  }

  async query<T = any>(
    query: string,
    variables?: Record<string, any>,
    operationName?: string
  ): Promise<GraphQLResponse<T>> {
    try {
      const requestBody: GraphQLRequest = {
        query,
        variables,
        operationName,
      };

      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`GraphQL request failed: ${response.status} ${response.statusText} - ${text}`);
      }

      const result: GraphQLResponse<T> = await response.json();

      if (result.errors && result.errors.length > 0) {
        console.error('GraphQL errors:', result.errors);
        throw new Error(result.errors.map(e => e.message).join(', '));
      }

      return result;
    } catch (error) {
      console.error('GraphQL query error:', error);
      throw error;
    }
  }

  async mutate<T = any>(
    mutation: string,
    variables?: Record<string, any>,
    operationName?: string
  ): Promise<GraphQLResponse<T>> {
    return this.query<T>(mutation, variables, operationName);
  }

  // Subscription support (using WebSocket or polling)
  subscribe<T = any>(
    subscription: string,
    variables?: Record<string, any>,
    onNext?: (data: T) => void,
    onError?: (error: Error) => void
  ): () => void {
    // For now, implement polling-based subscriptions
    // In production, use WebSocket for real-time updates
    let isActive = true;
    let intervalId: NodeJS.Timeout | null = null;

    const poll = async () => {
      if (!isActive) return;

      try {
        const result = await this.query<T>(subscription, variables);
        if (result.data && onNext) {
          onNext(result.data);
        }
      } catch (error) {
        if (onError) {
          onError(error as Error);
        }
      }
    };

    // Poll every 2 seconds
    intervalId = setInterval(poll, 2000);
    poll(); // Initial poll

    // Return unsubscribe function
    return () => {
      isActive = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }
}

// Default client instance
let defaultClient: GraphQLClient | null = null;

export function getGraphQLClient(endpoint?: string): GraphQLClient {
  if (!defaultClient || endpoint) {
    const url = endpoint || process.env.NEXT_PUBLIC_LINERA_GRAPHQL_URL || 'http://localhost:8080/graphql';
    defaultClient = new GraphQLClient(url);
  }
  return defaultClient;
}

