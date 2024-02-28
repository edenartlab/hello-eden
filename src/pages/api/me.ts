import { getSession } from "next-auth/react";
import { EdenClient } from "@edenlabs/eden-sdk";
import { NextApiRequest, NextApiResponse } from "next";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const session = await getSession({ req });
  console.log(session);
  if (!session || !session.accessToken) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const eden = new EdenClient({
      token: session.accessToken,
    });
    const user = await eden.creators.me();
    return res.status(200).json({ user });
  } catch (error) {
    // console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export default handler;
