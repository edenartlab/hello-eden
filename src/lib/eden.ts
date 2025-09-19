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
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
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

// Chat functions
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
  // TODO: Implement HTTP call to Eden API
  console.log("Listing agents");

  // Placeholder: return mock agents
  return [
    {
      id: "agent_1",
      name: "Creative Assistant",
      description: "Helps with creative tasks",
      createdAt: new Date(),
    },
    {
      id: "agent_2",
      name: "Art Generator",
      description: "Generates artistic images",
      createdAt: new Date(),
    },
  ];
}

export async function getAgent(agentId: string): Promise<Agent | null> {
  // TODO: Implement HTTP call to Eden API
  console.log("Getting agent:", agentId);

  const agents = await listAgents();
  return agents.find((a) => a.id === agentId) || null;
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
