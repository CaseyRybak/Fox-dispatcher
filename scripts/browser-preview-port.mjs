import { createServer } from "node:net";

async function probePort(port) {
  const server = createServer();

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", resolve);
  });

  const address = server.address();
  const selectedPort =
    typeof address === "object" && address ? address.port : 0;

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve(undefined)));
  });

  return selectedPort;
}

export async function reserveAvailablePort(
  preferredPort = 0,
  probe = probePort,
) {
  try {
    return await probe(preferredPort);
  } catch (error) {
    if (
      preferredPort !== 0 &&
      error instanceof Error &&
      "code" in error &&
      error.code === "EADDRINUSE"
    ) {
      return probe(0);
    }

    throw error;
  }
}
