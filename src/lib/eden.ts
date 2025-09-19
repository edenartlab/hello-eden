// Eden API functions
// Using direct HTTP calls to Eden API

const EDEN_API_BASE =
  process.env.NEXT_PUBLIC_EDEN_API_BASE || "https://api.eden.art";

export interface Task {
  taskId: string;
  status: "pending" | "processing" | "completed" | "failed";
  creation?: {
    uri: string;
  };
}

export interface Creation {
  _id: string;
  uri?: string;
  url?: string;
  thumbnail?: string;
  mediaAttributes?: {
    mimeType?: string;
    width?: number;
    height?: number;
  };
  prompt?: string;
  tool?: string;
  user?: {
    _id: string;
    username?: string;
    userImage?: string;
  };
  likeCount?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface Agent {
  _id: string;
  id?: string;
  name: string;
  description?: string;
  image?: string;
  userImage?: string;  // This is the actual profile picture field from the API
  key?: string;
  persona?: string;
  greeting?: string;
  knowledge?: string;
  voice?: string;
  models?: Array<{
    lora: string;
    use_when?: string;
  }>;
  suggestions?: Array<{
    label: string;
    prompt: string;
  }>;
  tools?: Record<string, boolean>;
  public?: boolean;
  owner_pays?: 'off' | 'deployments' | 'full' | boolean;
  llm_settings?: {
    model_profile?: 'low' | 'medium' | 'high';
    thinking_policy?: 'auto' | 'off' | 'always';
    thinking_effort_cap?: 'low' | 'medium' | 'high';
    thinking_effort_instructions?: string;
  };
  owner?: {
    _id: string;
    username?: string;
    userImage?: string;
  };
  isLiked?: boolean;
  permissions?: any[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
}

export interface ChatSession {
  id: string;
  agentId: string;
  messages: ChatMessage[];
  createdAt: Date;
}

export interface SessionCreateOptions {
  agent_ids: string[];
  content?: string;
  scenario?: string;
  budget?: {
    manna_budget?: number;
    token_budget?: number;
    turn_budget?: number;
  };
  title?: string;
  autonomy_settings?: {
    auto_reply: boolean;
    reply_interval: number;
    actor_selection_method: 'random' | 'random_exclude_last';
  };
}

export interface Session {
  _id: string;
  agent_ids: string[];
  messages: SessionMessage[];
  scenario?: string;
  budget?: {
    manna_budget?: number;
    token_budget?: number;
    turn_budget?: number;
    tokens_spent?: number;
    manna_spent?: number;
    turns_spent?: number;
  };
  title?: string;
  autonomy_settings?: {
    auto_reply: boolean;
    reply_interval: number;
    actor_selection_method: 'random' | 'random_exclude_last';
  };
  status: string;
  active_requests?: any[];
  createdAt: string;
  updatedAt: string;
}

export interface ToolCall {
  id: string;
  tool: string;
  args: Record<string, any>;
  task?: any;
  cost?: number;
  status?: string;
  result?: Array<{
    output?: Array<{
      filename?: string;
      mediaAttributes?: {
        mimeType?: string;
        width?: number;
        height?: number;
        aspectRatio?: number;
        blurhash?: string;
      };
      creation?: any;
    }>;
    subtool_calls?: Array<{
      tool: string;
      args: Record<string, any>;
      output?: string;
    }>;
    intermediate_outputs?: Record<string, any>;
  }>;
  reactions?: any;
  error?: any;
}

export interface SessionMessage {
  _id: string;
  session_id?: string;
  session?: string;
  role: 'user' | 'assistant' | 'system' | 'eden';
  content: string;
  agent_id?: string;
  sender?: string;
  attachments?: string[];
  thinking?: string;
  thought?: string;
  finish_reason?: 'stop' | 'length' | 'tool_calls' | 'tool_use' | null;
  tool_calls?: ToolCall[];
  reactions?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

// Creation functions
export async function createTask(
  prompt: string,
  type: "image" | "video" = "image",
  modelPreference?: string
): Promise<{ taskId: string }> {
  const payload: {
    tool: string;
    args: {
      prompt: string;
      output?: string;
      model_preference?: string;
    };
    makePublic: boolean;
  } = {
    tool: "create",
    args: {
      prompt: prompt,
    },
    makePublic: true,
  };

  // Add output type for video
  if (type === "video") {
    payload.args.output = "video";
  }

  // Add model preference if specified
  if (modelPreference) {
    payload.args.model_preference = modelPreference;
  }

  try {
    const response = await fetch(`${EDEN_API_BASE}/v2/tasks/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": process.env.EDEN_API_KEY || "",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Eden API Error ${response.status}:`, errorText);
      throw new Error(`Eden API ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log("Task creation response:", data);

    // API returns { task: { _id: "...", ... } }
    const taskId =
      data.task?._id || data.taskId || data.task_id || data.id || data._id;

    if (!taskId) {
      console.error("No taskId found in response:", data);
      throw new Error("No taskId returned from Eden API");
    }

    return { taskId };
  } catch (error) {
    console.error("Failed to create task:", error);
    throw error;
  }
}

export async function pollTask(taskId: string): Promise<Task> {
  console.log("Polling task with ID:", taskId);

  if (!taskId || taskId === "undefined") {
    throw new Error("Invalid taskId provided to pollTask");
  }

  try {
    const response = await fetch(`${EDEN_API_BASE}/v2/tasks/${taskId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": process.env.EDEN_API_KEY || "",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Eden API Error ${response.status}:`, errorText);
      throw new Error(`Eden API ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log("Task poll response:", data);

    // API returns { task: { _id: "...", status: "...", result: [...] } }
    const task = data.task || data;

    // Map API response to our Task interface
    return {
      taskId: task._id || task.taskId || task.task_id || task.id || taskId,
      status: task.status,
      creation:
        task.result && task.result.length > 0 && task.result[0].output
          ? {
              uri:
                task.result[0].output[0]?.url || task.result[0].output[0]?.uri,
            }
          : undefined,
    };
  } catch (error) {
    console.error("Failed to poll task:", error);
    throw error;
  }
}

// Session functions
export async function createSession(
  options: SessionCreateOptions
): Promise<{ session_id: string }> {
  try {
    const response = await fetch(`${EDEN_API_BASE}/v2/sessions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": process.env.EDEN_API_KEY || "",
      },
      body: JSON.stringify(options),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Eden API Error ${response.status}:`, errorText);
      throw new Error(`Eden API ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log("Session creation response:", data);

    return { session_id: data.session_id };
  } catch (error) {
    console.error("Failed to create session:", error);
    throw error;
  }
}

export async function getSession(sessionId: string): Promise<Session | null> {
  try {
    const response = await fetch(`${EDEN_API_BASE}/v2/sessions/${sessionId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": process.env.EDEN_API_KEY || "",
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      const errorText = await response.text();
      console.error(`Eden API Error ${response.status}:`, errorText);
      throw new Error(`Eden API ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log("Session get response:", data);

    return data.session;
  } catch (error) {
    console.error("Failed to get session:", error);
    throw error;
  }
}

export async function sendSessionMessage(
  sessionId: string,
  content: string,
  attachments?: string[],
  agent_ids?: string[]
): Promise<{ session_id: string }> {
  try {
    const response = await fetch(`${EDEN_API_BASE}/v2/sessions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": process.env.EDEN_API_KEY || "",
      },
      body: JSON.stringify({
        session_id: sessionId,
        content,
        attachments,
        ...(agent_ids && { agent_ids })
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Eden API Error ${response.status}:`, errorText);
      throw new Error(`Eden API ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log("Session message response:", data);

    return { session_id: data.session_id };
  } catch (error) {
    console.error("Failed to send session message:", error);
    throw error;
  }
}

// Chat functions (legacy)
export async function createChatSession(agentId: string): Promise<ChatSession> {
  // TODO: Implement HTTP call to Eden API
  console.log("Creating chat session with agent:", agentId);

  return {
    id: `session_${Date.now()}`,
    agentId,
    messages: [],
    createdAt: new Date(),
  };
}

export async function sendChatMessage(
  sessionId: string,
  message: string
): Promise<ChatMessage> {
  // TODO: Implement HTTP call to Eden API
  console.log("Sending message to session:", sessionId, message);

  return {
    id: `msg_${Date.now()}`,
    role: "assistant",
    content: `This is a placeholder response to: "${message}"`,
    createdAt: new Date(),
  };
}

// Agent functions
export async function listAgents(): Promise<Agent[]> {
  try {
    const response = await fetch(`${EDEN_API_BASE}/v2/agents`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.EDEN_API_KEY && {
          "X-Api-Key": process.env.EDEN_API_KEY,
        }),
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Eden API Error ${response.status}:`, errorText);
      throw new Error(`Eden API ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log("Agents list response:", data);

    return data.docs || [];
  } catch (error) {
    console.error("Failed to list agents:", error);
    return [];
  }
}

export async function getAgent(agentId: string): Promise<Agent | null> {
  try {
    const response = await fetch(`${EDEN_API_BASE}/v2/agents/${agentId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.EDEN_API_KEY && {
          "X-Api-Key": process.env.EDEN_API_KEY,
        }),
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      const errorText = await response.text();
      console.error(`Eden API Error ${response.status}:`, errorText);
      throw new Error(`Eden API ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return data.agent || null;
  } catch (error) {
    console.error("Failed to get agent:", error);
    return null;
  }
}

// Creation functions
export interface CreationsResponse {
  docs: Creation[];
  nextCursor?: string;
  hasMore?: boolean;
}

export async function getCreations(filters?: {
  cursor?: string;
  limit?: number;
  type?: "image" | "video" | "all";
  onlyMine?: boolean;
  onlyAgents?: boolean;
  sort?: string;
  filter?: string[];
}): Promise<CreationsResponse> {
  try {
    const params = new URLSearchParams();

    // Set pagination
    if (filters?.cursor) {
      params.append("cursor", filters.cursor);
    }
    params.append("limit", (filters?.limit || 20).toString());

    // Add media type filter
    if (filters?.type && filters.type !== "all") {
      params.append("filter", `output_type;${filters.type}`);
    }

    // Filter by agent when onlyAgents is true
    if (filters?.onlyAgents && process.env.NEXT_PUBLIC_EDEN_AGENT_ID) {
      params.append("filter", `agent;${process.env.NEXT_PUBLIC_EDEN_AGENT_ID}`);
      console.log(
        "Added agent filter:",
        `agent;${process.env.NEXT_PUBLIC_EDEN_AGENT_ID}`
      );
    } else if (filters?.onlyAgents) {
      console.error("NEXT_PUBLIC_EDEN_AGENT_ID not found in environment");
    }

    // Add additional filters
    if (filters?.filter) {
      filters.filter.forEach((f) => params.append("filter", f));
    }

    console.log("Final request params:", params.toString());
    console.log("OnlyMine flag:", filters?.onlyMine);
    console.log("OnlyAgents flag:", filters?.onlyAgents);
    console.log(
      "Will authenticate:",
      !!((filters?.onlyMine || filters?.onlyAgents) && process.env.EDEN_API_KEY)
    );

    console.log(
      "FINAL REQUEST URL:",
      `${EDEN_API_BASE}/v2/feed-cursor/creations?${params.toString()}`
    );

    const response = await fetch(
      `${EDEN_API_BASE}/v2/feed-cursor/creations?${params.toString()}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          // Authenticate if we want private creations (onlyMine=true) or agent creations (onlyAgents=true)
          ...((filters?.onlyMine || filters?.onlyAgents) &&
            process.env.EDEN_API_KEY && {
              "x-api-key": process.env.EDEN_API_KEY,
            }),
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Eden API Error ${response.status}:`, errorText);
      console.error(
        "Request URL:",
        `${EDEN_API_BASE}/v2/feed-cursor/creations?${params.toString()}`
      );
      console.error("Request headers:", {
        "Content-Type": "application/json",
        ...((filters?.onlyMine || filters?.onlyAgents) &&
          process.env.EDEN_API_KEY && {
            "x-api-key": process.env.EDEN_API_KEY,
          }),
      });
      throw new Error(`Eden API ${response.status}: ${errorText}`);
    }

    const data = await response.json();

    return {
      docs: data.docs || [],
      nextCursor: data.nextCursor,
      hasMore: data.docs?.length === (filters?.limit || 20),
    };
  } catch (error) {
    console.error("Failed to fetch creations:", error);
    return { docs: [], hasMore: false };
  }
}

export async function getCreation(
  creationId: string
): Promise<Creation | null> {
  try {
    const response = await fetch(
      `${EDEN_API_BASE}/v2/creations/${creationId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(process.env.EDEN_API_KEY && {
            "x-api-key": process.env.EDEN_API_KEY,
          }),
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch creation: ${response.status}`);
    }

    const data = await response.json();
    return data.creation || null;
  } catch (error) {
    console.error("Failed to fetch creation:", error);
    return null;
  }
}
