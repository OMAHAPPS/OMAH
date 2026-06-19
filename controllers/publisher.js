import nlp from 'compromise';
import { TwitterApi } from 'twitter-api-v2';
import 'dotenv/config';

// Initialize the X API client with read/write write permissions
const client = new TwitterApi({
  appKey: process.env.X_API_KEY,
  appSecret: process.env.X_API_SECRET,
  accessToken: process.env.X_ACCESS_TOKEN,
  accessSecret: process.env.X_ACCESS_SECRET,
});

/**
 * Parses raw text to extract high-value semantic nouns 
 * and strips external links to optimize reach.
 */
function optimizePostPayload(rawDraft, nicheTags = []) {
  // 1. Parse text using NLP to identify semantic entity blocks
  const doc = nlp(rawDraft);
  
  // Extract organizations, topics, places, and people
  const organizations = doc.organizations().out('array');
  const topics = doc.nouns().topics().out('array');
  const extractedEntities = [...new Set([...organizations, ...topics])];

  // 2. Clear out external links to prevent the algorithm from down-ranking the post body
  let cleanText = rawDraft;
  let linkNotice = "Pass: Text structural formatting is clean.";
  
  if (rawDraft.includes('http')) {
    cleanText = rawDraft.split(' ').filter(word => !word.startsWith('http')).join(' ');
    linkNotice = "Optimized: Extracted external URL from body text to maximize distribution.";
  }

  // 3. Format exactly 2 niche semantic anchor tags for the footer
  const formattedTags = nicheTags.slice(0, 2).map(tag => `#${tag.replace(/\s+/g, '')}`).join(' ');

  // 4. Combine into final compliant structure
  const finalPayload = `${cleanText.trim()}\n\n${formattedTags}`.trim();

  return {
    payload: finalPayload,
    entities: extractedEntities,
    log: linkNotice
  };
}

/**
 * Master execution function
 */
async function publishOptimizedPost(rawDraft, tags) {
  try {
    // Run optimization pipeline
    const structuralData = optimizePostPayload(rawDraft, tags);
    
    console.log("--- Pipeline Diagnostic ---");
    console.log(`Detected Classification Signals: [${structuralData.entities.join(', ')}]`);
    console.log(`Link Security: ${structuralData.log}`);
    console.log(`Final Output Size: ${structuralData.payload.length} chars`);
    console.log(`---------------------------\n`);

    // Dispatch payload directly to X architecture
    const response = await client.v2.tweet(structuralData.payload);
    console.log(`Success! Post successfully mapped and published. ID: ${response.data.id}`);
    return response;
  } catch (error) {
    console.error("Pipeline failure during transmission:", error);
  }
}

// --- Trigger Pipeline Example ---
const userDraft = "I love playing Elden Ring on my PlayStation 5 check out my stream link here http://twitch.tv";
const clusterTags = ["Gaming", "RPG"];

publishOptimizedPost(userDraft, clusterTags);




//    maximize with categories

import nlp from 'compromise';

// Mapping table grouping niche entity tokens into macro system categories
const MACRO_CATEGORIES = {
  // --- NEWS ---
  'breaking': 'News', 'election': 'News', 'congress': 'News', 'parliament': 'News',
  'senate': 'News', 'white house': 'News', 'reuters': 'News', 'ap news': 'News',
  'gazette': 'News', 'headline': 'News', 'investigative': 'News', 'journalism': 'News',

  // --- GAMING ---
  'playstation': 'Gaming', 'xbox': 'Gaming', 'nintendo': 'Gaming', 'pc gaming': 'Gaming',
  'elden ring': 'Gaming', 'gta': 'Gaming', 'fps': 'Gaming', 'rpg': 'Gaming',
  'twitch': 'Gaming', 'esports': 'Gaming', 'steam': 'Gaming', 'dlc': 'Gaming',

  // --- FOOD ---
  'recipe': 'Food', 'culinary': 'Food', 'gourmet': 'Food', 'chef': 'Food',
  'restaurant': 'Food', 'baking': 'Food', 'diet': 'Food', 'keto': 'Food',
  'vegan': 'Food', 'mukbang': 'Food', 'pastry': 'Food', 'air fryer': 'Food',

  // --- CELEBRITIES ---
  'hollywood': 'Celebrities', 'red carpet': 'Celebrities', 'paparazzi': 'Celebrities', 'oscars': 'Celebrities',
  'kardashian': 'Celebrities', 'swiftie': 'Celebrities', 'grammys': 'Celebrities', 'biopic': 'Celebrities',
  'influencer': 'Celebrities', 'pop star': 'Celebrities', 'fandom': 'Celebrities',

  // --- FITNESS ---
  'bodybuilding': 'Fitness', 'cardio': 'Fitness', 'workout': 'Fitness', 'calisthenics': 'Fitness',
  'gym': 'Fitness', 'protein shake': 'Fitness', 'creatine': 'Fitness', 'marathon': 'Fitness',
  'crossfit': 'Fitness', 'powerlifting': 'Fitness', 'hiit': 'Fitness', 'activewear': 'Fitness'
};

/**
 * Parses user text using the macro dictionary matrix
 */
function processMacroCategories(rawDraft) {
  // Pass the target categories array directly into compromise
  const doc = nlp(rawDraft.toLowerCase(), MACRO_CATEGORIES);
  const detectedCategories = [];

  // Evaluate matches based on keywords flagged by our categories mapping
  Object.keys(MACRO_CATEGORIES).forEach(keyword => {
    if (doc.has(keyword)) {
      detectedCategories.push(MACRO_CATEGORIES[keyword]);
    }
  });

  // Return a clean list of unique macro categories identified in the post text
  return [...new Set(detectedCategories)];
}


// OUTPUT

{
  "success", true,
  "message", "Post processed and mapped across the platform cluster architecture.",
  "optimizationEngineOutput", {
    "rawDraftInput": "Just crushed a high-intensity cardio workout and drank a clean protein shake check my progress photo here http://link.com",
    "finalBroadcastText": "Just crushed a high-intensity cardio workout and drank a clean protein shake check my progress photo here\n\n#Fitness",
    "detectedSemanticEntities": [
      "cardio workout",
      "protein shake"
    ],
    "customCategoriesMapped": [
      "Fitness"
    ],
    "linkStrippedFromBody": true
  }
}



//  timeout handling ack

io.on("connection", (socket) => {
  socket.on("request_data", async (data, callback) => {
    let isTimedOut = false;

    // 1. Start a safety timer matching your client timeout (e.g., 5000ms)
    const serverTimeout = setTimeout(() => {
      isTimedOut = true;
      console.error(`Execution timeout for socket ${socket.id}. Aborting processing.`);
      
      // Optional: Perform server-side cleanup here (e.g., abort DB queries)
    }, 5000);

    try {
      // Simulate heavy asynchronous database or API processing
      const result = await processHeavyData(data);

      // 2. Check if the server already timed out before responding
      if (!isTimedOut) {
        clearTimeout(serverTimeout);
        callback({ status: "ok", result }); 
      }
    } catch (error) {
      if (!isTimedOut) {
        clearTimeout(serverTimeout);
        callback({ status: "error", message: "Processing failed" });
      }
    }
  });
});


//CLIENT SIDE

try {
  // Sets a strict 5-second window for the server to reply
  const response = await socket.timeout(5000).emitWithAck("request_data", myData);
  console.log("Success:", response);
} catch (error) {
  // If the server-side timer triggers, this block catches the timeout error
  console.error("The server failed to acknowledge the event within 5000ms.");
}