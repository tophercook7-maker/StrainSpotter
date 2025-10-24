import { useState } from 'react';
import { Box, Container, Typography, Tabs, Tab, Stack, Button, Alert, Slider, Paper, Grid } from '@mui/material';
import { ArrowBack, MenuBook, LocalFlorist, Grain, Opacity, WbSunny, Spa, Engineering, BugReport, Science, WaterDrop } from '@mui/icons-material';

function Section({ title, children }) {
  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle1" fontWeight={800} gutterBottom sx={{ color: '#000' }}>
        {title}
      </Typography>
      <Typography variant="body2" sx={{ color: '#000' }}>
        {children}
      </Typography>
    </Box>
  );
}

export default function GrowCoach({ onBack }) {
  const [tab, setTab] = useState(0);
  return (
    <Container maxWidth="md" sx={{ 
      py: 3,
      bgcolor: 'rgba(255, 255, 255, 0.72)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      border: '1px solid rgba(255,255,255,0.25)',
      boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
      minHeight: '100vh',
      position: 'relative',
      zIndex: 2
    }}>
      {/* Back */}
      {onBack && (
        <Button onClick={onBack} startIcon={<ArrowBack />} sx={{ mb: 1, textTransform: 'none', fontWeight: 700, color: '#000' }}>
          Home
        </Button>
      )}

      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
        <MenuBook sx={{ color: '#7CB342' }} />
        <Typography variant="h5" fontWeight={900} sx={{ color: '#000' }}>Grow Coach</Typography>
      </Stack>
      <Typography variant="body2" sx={{ mb: 2, color: '#000' }}>
        Your step-by-step guide from seed to harvest. Keep it simple, consistent, and clean.
      </Typography>

      <Tabs value={tab} onChange={(e, v) => setTab(v)} variant="scrollable" allowScrollButtonsMobile sx={{ mb: 2 }}>
        <Tab icon={<LocalFlorist />} iconPosition="start" label="Overview" />
        <Tab icon={<Engineering />} iconPosition="start" label="Setup" />
        <Tab icon={<Grain />} iconPosition="start" label="Germination" />
        <Tab icon={<WbSunny />} iconPosition="start" label="Vegetative" />
        <Tab icon={<Spa />} iconPosition="start" label="Flowering" />
        <Tab icon={<MenuBook />} iconPosition="start" label="Harvest" />
        <Tab icon={<Opacity />} iconPosition="start" label="Dry & Cure" />
        <Tab icon={<WaterDrop />} iconPosition="start" label="Watering" />
        <Tab icon={<Science />} iconPosition="start" label="Nutrients & Deficiencies" />
        <Tab icon={<BugReport />} iconPosition="start" label="Pests & IPM" />
        <Tab icon={<MenuBook />} iconPosition="start" label="Schedules & Checklists" />
      </Tabs>

      {tab === 0 && (
        <Box>
          <Alert severity="info" sx={{ mb: 2 }}>
            Welcome to your grow journey! Think of this as sitting down with an experienced gardener who's been through it all. Growing cannabis isn't rocket science, but consistency and observation are your best friends. Let's get you growing top-shelf flower!
          </Alert>
          
          <Section title="The Four Pillars of Success">
            <strong>1. Environment:</strong> Keep your VPD (vapor pressure deficit), temperature, and humidity dialed in. This is where 80% of problems come from if it's off.<br /><br />
            <strong>2. Genetics:</strong> Start with quality seeds or clones from trusted sources. You can't grow fire from trash genetics.<br /><br />
            <strong>3. Feeding:</strong> Less is more. It's easier to add nutrients than to fix toxicity. Watch your plants—they'll tell you what they need.<br /><br />
            <strong>4. Observation:</strong> Check your plants daily. Catch problems early when they're easy to fix. Take photos to track progress.
          </Section>

          <Section title="Essential Equipment Checklist">
            <strong>Space:</strong><br />
            • Grow tent (2x2 to 4x4 for beginners) with reflective interior<br />
            • Intake and exhaust fans with carbon filter for odor control<br />
            • Oscillating fans for air circulation (gentle breeze, not a wind tunnel)<br /><br />
            <strong>Lighting:</strong><br />
            • Full-spectrum LED with dimmer (Mars Hydro, Spider Farmer, HLG are solid)<br />
            • Timer for precise light cycles (digital preferred)<br />
            • Target: 300-400 PPFD for veg, 600-900 PPFD for flower<br /><br />
            <strong>Growing Medium:</strong><br />
            • Fabric pots (3-5 gallon) for better aeration<br />
            • Quality soil (Fox Farms, Coast of Maine) OR coco coir + perlite mix<br />
            • Saucers or trays for runoff collection<br /><br />
            <strong>Monitoring:</strong><br />
            • Hygrometer/thermometer at canopy level<br />
            • pH meter (digital preferred, calibrate monthly)<br />
            • TDS/EC meter for nutrient strength<br />
            • Jeweler's loupe (60x) for checking trichomes at harvest<br /><br />
            <strong>Nutrients & Supplies:</strong><br />
            • Simple 2-3 part nutrient line (General Hydroponics, Canna, Megacrop)<br />
            • Cal-Mag supplement (especially for LED grows)<br />
            • pH up/down solutions<br />
            • Clean scissors/pruning shears
          </Section>

          <Section title="Environment Targets (By Growth Stage)">
            <strong>Seedlings (0-2 weeks):</strong><br />
            • Temperature: 75-80°F (24-27°C)<br />
            • Humidity: 65-75% RH<br />
            • Light: 18-24 hours on, low intensity (200-300 PPFD)<br />
            • VPD: 0.4-0.8 kPa<br />
            <em>Pro tip: Use a humidity dome or plastic wrap over pots initially. Remove gradually to acclimate seedlings.</em><br /><br />
            
            <strong>Vegetative (2-8 weeks):</strong><br />
            • Temperature: 72-85°F (22-29°C)<br />
            • Humidity: 45-65% RH<br />
            • Light: 18-24 hours on, medium intensity (400-600 PPFD)<br />
            • VPD: 0.8-1.2 kPa<br />
            <em>Pro tip: Higher temps are okay if you have good air circulation. Watch for heat stress (tacoing leaves).</em><br /><br />
            
            <strong>Early Flower (weeks 1-3):</strong><br />
            • Temperature: 70-80°F (21-27°C)<br />
            • Humidity: 45-55% RH<br />
            • Light: 12/12 cycle, higher intensity (600-800 PPFD)<br />
            • VPD: 1.0-1.4 kPa<br />
            <em>Pro tip: This is when the plant stretches. Keep light distance right to control stretch without burning.</em><br /><br />
            
            <strong>Mid-Late Flower (weeks 4+):</strong><br />
            • Temperature: 65-78°F (18-26°C), with 5-10°F drop at night<br />
            • Humidity: 40-50% RH (drop to 30-40% last 2 weeks)<br />
            • Light: 12/12 cycle, full intensity (800-1000 PPFD)<br />
            • VPD: 1.2-1.6 kPa<br />
            <em>Pro tip: Lower humidity late in flower prevents mold. Increase airflow but don't blast buds directly.</em>
          </Section>

          <Section title="Your First Grow Roadmap">
            <strong>Week 0:</strong> Set up tent, dial in environment, run system empty for 24-48h to verify temps/humidity<br />
            <strong>Weeks 1-2:</strong> Germinate and establish seedlings<br />
            <strong>Weeks 3-6:</strong> Vegetative growth, training, building strong structure<br />
            <strong>Weeks 7-8:</strong> Pre-flower prep, final training, switch to 12/12<br />
            <strong>Weeks 9-16:</strong> Flowering, bud development, monitor daily<br />
            <strong>Weeks 17-18:</strong> Dry and cure for premium quality<br /><br />
            <em>Remember: This timeline is approximate. Sativa-dominant strains can take 10-12 weeks in flower, while some indicas finish in 7-8 weeks. Always go by plant signals, not calendar.</em>
          </Section>

          <Alert severity="warning" sx={{ mt: 2 }}>
            <strong>Common Beginner Mistakes to Avoid:</strong><br />
            • Overwatering (top killer of seedlings—let soil dry between waterings)<br />
            • Overfeeding (start at 1/4 to 1/2 recommended dose)<br />
            • Light too close or too far (check manufacturer's height chart)<br />
            • Poor air circulation (stagnant air = mold and pests)<br />
            • Impatience at harvest (check trichomes, not just pistils!)
          </Alert>
        </Box>
      )}

      {tab === 1 && (
        <Box>
          <Section title="Space & Equipment">
            • 2x2–3x3 tent for beginners; ensure passive intake and active exhaust with carbon filter.<br />
            • Quality LED with reliable PAR map; target 300–900 PPFD depending on stage.<br />
            • Oscillating fans for gentle movement, not hurricane winds.
          </Section>
          <Section title="Mediums">
            • Soil (forgiving): start with quality amended soil; water-only early on.<br />
            • Coco (responsive): requires daily feeding at 10–20% runoff; pH 5.8–6.2.<br />
            • Hydro (advanced): faster growth, tighter control needed.
          </Section>
          <Section title="Containers">
            • Fabric pots 3–5 gal common indoors; promote air pruning and healthy roots.
          </Section>
          <Section title="Monitoring">
            • Hygrometer/Thermometer at canopy; optional Bluetooth sensors for logs.<br />
            • Consider cheap lux meter or PAR estimates to avoid light burn.
          </Section>
        </Box>
      )}

      {tab === 2 && (
        <Box>
          <Section title="Germination: Your Plant's First Breath (Days 1-7)">
            <strong>The Paper Towel Method (Most Reliable):</strong><br />
            1. <strong>Soak seeds:</strong> Drop seeds in a glass of room-temp water for 12-24 hours in a dark place. They should sink after a few hours (if they float, that's okay—give them time).<br />
            2. <strong>Paper towel sandwich:</strong> Place seeds between 2-3 layers of damp (not soaking) paper towels on a plate. Cover with another plate or plastic dome to maintain moisture.<br />
            3. <strong>Wait for taproot:</strong> Keep at 70-80°F in darkness. Check daily—don't let towels dry out! You'll see a white taproot emerge in 1-5 days.<br />
            4. <strong>Plant when ready:</strong> Once taproot is 0.25-0.5 inches (¼ to ½ inch), gently transfer to your medium.<br /><br />

            <strong>Planting Your Germinated Seed:</strong><br />
            • Prepare your pot with pre-moistened medium (not soaking wet)<br />
            • Make a small hole about 0.25-0.5 inches deep<br />
            • <em>Gently</em> place seed with taproot pointing DOWN (or sideways is fine)<br />
            • Lightly cover with medium—don't pack it down<br />
            • Mist the surface lightly with pH'd water<br />
            • Keep soil surface moist (not wet) until seedling emerges<br /><br />

            <strong>First Days Above Soil (Days 1-5):</strong><br />
            • You'll see the seedling push through in 1-3 days<br />
            • First you'll see the cotyledons (round "seed leaves")—these are not true leaves<br />
            • Keep humidity high (65-75%) with a dome or plastic wrap<br />
            • Light should be on 18-24 hours, but gentle—200-300 PPFD or 12-18 inches from a small LED<br />
            • <strong>Critical:</strong> Don't water heavily yet! Mist around the seedling or water lightly in a small circle. Overwatering kills more seedlings than anything else.<br /><br />

            <strong>Troubleshooting Germination:</strong><br />
            • <strong>Seed won't crack after 48h in water:</strong> Gently scarify (rub with sandpaper) and try again<br />
            • <strong>Taproot stopped growing:</strong> Temperature probably too cold—move to warmer spot (75-80°F ideal)<br />
            • <strong>Helmet head (seed shell stuck on leaves):</strong> Mist it heavily and wait 30 min, then gently remove with tweezers. Don't force it!<br />
            • <strong>Seedling stretched (long stem, falling over):</strong> Light is too far away. Move light closer and gently bury stem a bit deeper when transplanting.<br /><br />

            <Alert severity="success">
              <strong>Pro Tip:</strong> Old seeds (1-2+ years) germinate slower. Be patient and maintain consistent warmth and moisture. Don't give up until day 10!
            </Alert>
          </Section>

          <Section title="First True Leaves (Days 5-14)">
            • After cotyledons, you'll see the first set of "true" serrated cannabis leaves<br />
            • This is when your plant starts photosynthesizing for real<br />
            • <strong>Gradually remove humidity dome</strong> over 2-3 days (crack it open more each day)<br />
            • Start very light feeding if in inert medium (1/4 strength veg nutrients)<br />
            • If in quality soil, don't feed—just pH'd water for first 2-3 weeks<br />
            • Increase light intensity slightly as leaves develop (300-400 PPFD)<br />
            • <strong>Watch for:</strong> Yellow leaves (needs nitrogen or light), drooping (overwater), stretching (light too far)<br /><br />

            <em>Remember: Seedlings are fragile but resilient. Don't panic if growth seems slow the first week—they're building roots underground!</em>
          </Section>
        </Box>
      )}

      {tab === 3 && (
        <Box>
          <Section title="Vegetative Stage: Building Your Plant's Foundation (Weeks 3-8+)">
            <strong>What's Happening:</strong><br />
            This is when your plant is all about growth—building stems, branches, and tons of leaves to power flowering later. You control how long veg lasts by keeping lights on 18-24 hours. Most growers veg for 4-8 weeks depending on space and goals.<br /><br />

            <strong>Light Schedule:</strong><br />
            • 18/6 (18 hours on, 6 off) is most common and energy-efficient<br />
            • 20/4 or 24/0 for faster growth, but diminishing returns and higher electric bills<br />
            • Keep lights at proper height: too close = light stress/bleaching, too far = stretching<br />
            • <em>You'll notice nodes (where branches meet the stem) stacking closer together under good light</em><br /><br />

            <strong>Watering in Veg:</strong><br />
            • <strong>Golden rule:</strong> Water when top 1-2 inches of soil is dry, or pot feels light when you lift it<br />
            • Young plants need less frequent watering; as roots develop, frequency increases<br />
            • Always water until you get 10-20% runoff from the bottom—this prevents salt buildup<br />
            • pH your water to 6.0-6.5 for soil, 5.8-6.2 for coco<br />
            • <em>Overwatering looks like: droopy leaves that don't perk up, slow growth, soil stays wet for days</em><br />
            • <em>Underwatering looks like: wilting that fixes immediately after watering, dry/crusty top soil</em><br /><br />

            <strong>Feeding Strategy:</strong><br />
            • <strong>In quality soil:</strong> Don't feed for first 3-4 weeks—soil has nutrients already<br />
            • <strong>In coco/hydro:</strong> Start feeding immediately at 1/4 strength, increase to 1/2 by week 2<br />
            • Veg nutrients are high in Nitrogen (N) for leafy growth<br />
            • <strong>Start low!</strong> Begin at 1/4 to 1/2 the recommended dose on the bottle<br />
            • Increase slowly based on plant response—dark green with clawing = too much N<br />
            • Feed every 2-3 waterings in soil, every watering in coco (with plain water occasionally to flush)<br /><br />

            <Alert severity="info" sx={{ mb: 2 }}>
              <strong>Reading Your Plant:</strong><br />
              • <strong>Happy plant:</strong> Praying leaves (angled up slightly), vibrant green, new growth every day<br />
              • <strong>Nitrogen deficiency:</strong> Lower leaves yellowing and falling off—increase veg nutrients<br />
              • <strong>Nitrogen toxicity:</strong> Very dark green, clawing leaf tips—reduce nutrients and flush<br />
              • <strong>Light stress:</strong> Leaves tacoing (folding upward), bleaching to white/yellow—raise light or dim<br />
              • <strong>Cal-Mag deficiency:</strong> Rusty spots, yellowing between veins—add Cal-Mag supplement
            </Alert>
          </Section>

          <Section title="Training Techniques: Shape Your Canopy">
            Training helps you control plant shape, maximize light penetration, and increase yields. Here's what experienced growers do:<br /><br />

            <strong>1. Low Stress Training (LST) - Beginner Friendly:</strong><br />
            • <strong>What:</strong> Gently bend and tie branches to create a flat, even canopy<br />
            • <strong>When:</strong> Start when plant has 4-6 nodes, continue throughout veg<br />
            • <strong>How:</strong> Use soft plant ties or garden wire. Bend the main stem and tie to pot edge. Spread side branches outward.<br />
            • <strong>Why:</strong> Even canopy = even light distribution = more bud sites at the same height<br />
            • <em>Pro tip: Check and adjust ties every few days—stems grow fast and can outgrow restraints</em><br /><br />

            <strong>2. Topping - Increase Main Colas:</strong><br />
            • <strong>What:</strong> Cut the main stem tip above a node to split growth into two main colas<br />
            • <strong>When:</strong> After 4-6 nodes have developed; avoid topping within 2 weeks of flipping to flower<br />
            • <strong>How:</strong> Use clean, sharp scissors. Cut just above the node you want to become your new tops.<br />
            • <strong>Recovery:</strong> Plant will pause growth for 3-5 days, then explode with new growth<br />
            • <em>Can be repeated: Some growers top 2-3 times to create 4, 8, or 16 main colas</em><br /><br />

            <strong>3. FIM (F*ck I Missed) - Similar to Topping:</strong><br />
            • Cut 75% of the newest growth instead of a clean cut<br />
            • Creates 4+ new tops instead of 2<br />
            • Less stress than topping, but less predictable results<br /><br />

            <strong>4. Defoliation - Improve Light & Airflow:</strong><br />
            • <strong>What:</strong> Strategic removal of fan leaves blocking bud sites or restricting airflow<br />
            • <strong>When:</strong> Light defoliation in late veg, heavier at start of flower and week 3 of flower<br />
            • <strong>How:</strong> Remove large fan leaves that shade lower bud sites. Don't go crazy—leaves power growth!<br />
            • <strong>Rule:</strong> Never remove more than 20-30% of leaves at once<br />
            • <em>Focus on interior/lower leaves; keep top canopy leaves for photosynthesis</em><br /><br />

            <strong>5. SCROG (Screen of Green) - Advanced:</strong><br />
            • Install a horizontal net/screen 8-12 inches above pots<br />
            • Tuck branches under the screen as they grow, creating a flat canopy<br />
            • Maximizes light use and yield per square foot<br />
            • <strong>Commitment:</strong> Plants are locked in place; no moving them after you start<br /><br />

            <strong>6. Lollipopping - Late Veg / Early Flower:</strong><br />
            • Remove all growth (branches and leaves) from bottom 1/3 of plant<br />
            • Focuses energy on top colas instead of popcorn buds that won't get light<br />
            • Do this right before or during the first week of flower<br />
            • Results in fewer but larger, denser buds
          </Section>

          <Section title="Veg Timeline & What to Expect">
            <strong>Weeks 2-3:</strong> Explosive growth starts. 3-4 nodes, first training begins<br />
            <strong>Weeks 4-5:</strong> Plant doubles in size. Topping if planned. Heavy LST<br />
            <strong>Weeks 6-7:</strong> Canopy fills out. Pre-flower signs may appear (early pistils at nodes)<br />
            <strong>Week 8+:</strong> Plant reaches desired size. Prepare for flip to 12/12<br /><br />

            <Alert severity="warning">
              <strong>When to Flip to Flower:</strong><br />
              • Flip when plant is 50-60% of your target final height (plants stretch 2x in flower!)<br />
              • Indica dominant: less stretch (1.5-2x)<br />
              • Sativa dominant: more stretch (2-3x)<br />
              • <em>Example: If you have 5ft of vertical space, flip when plant is 2-2.5ft tall</em>
            </Alert>
          </Section>
        </Box>
      )}

      {tab === 4 && (
        <Box>
          <Section title="Flowering Stage: Where the Magic Happens (Weeks 1-14)">
            <strong>The Big Flip: Switching to 12/12:</strong><br />
            This is it! You're triggering your plant to flower by switching to 12 hours of light, 12 hours of complete darkness. <strong>Darkness must be absolute</strong>—even small light leaks can cause problems (hermaphrodites, re-vegging).<br /><br />

            <strong>What you need to do:</strong><br />
            • Set timer to exactly 12 hours on, 12 hours off<br />
            • Verify NO light leaks during dark period (check with eyes adjusted to darkness)<br />
            • Switch from veg nutrients to bloom nutrients (lower N, higher P and K)<br />
            • <em>Mark this date on your calendar—this is "Day 1 of Flower" for tracking harvest timing</em><br /><br />

            <Alert severity="warning" sx={{ mb: 2 }}>
              <strong>The Flower Stretch (Weeks 1-3):</strong><br />
              Your plant will stretch 1.5-3x its current height! This is normal but can surprise new growers. Make sure you have vertical space. Continue LST early in flower to manage height. Stop all training by end of week 3.
            </Alert>
          </Section>

          <Section title="Flowering Timeline - What to Expect Week by Week">
            <strong>Week 1 (Transition):</strong><br />
            • Growth continues similar to veg for first few days<br />
            • Stretching accelerates by day 5-7<br />
            • First pistils (white hairs) appear at branch nodes<br />
            • <strong>Your job:</strong> Switch to bloom nutrients at 1/2 strength, continue light LST if needed, watch headroom<br /><br />

            <strong>Week 2 (Pre-Flower):</strong><br />
            • Rapid vertical growth—this is the peak of stretch<br />
            • Pistils multiply and cluster at every node<br />
            • You can start to identify male plants if growing regular seeds (balls instead of pistils—remove immediately!)<br />
            • <strong>Your job:</strong> Increase bloom nutrients to 3/4 strength, light defoliation of inner fan leaves blocking sites<br /><br />

            <strong>Week 3 (Early Bud Formation):</strong><br />
            • Stretch slows down—vertical growth mostly done<br />
            • Small bud formations visible at every cola<br />
            • Smell intensifies—make sure your carbon filter is working!<br />
            • <strong>Your job:</strong> Full-strength nutrients, major defoliation pass (remove blocking fan leaves), lollipop bottom 1/3 if not done yet<br />
            • <em>This is your last chance for heavy defoliation—after this, let them grow!</em><br /><br />

            <strong>Weeks 4-5 (Mid Flower - Bud Swell Begins):</strong><br />
            • Buds start to fatten and stack<br />
            • Calyxes (the "buds") multiply and cluster tightly<br />
            • Trichome production visible (frosty appearance starting)<br />
            • <strong>Your job:</strong> Maintain full feeding schedule, monitor for deficiencies (especially Cal-Mag), keep environment stable<br />
            • <strong>Watch for:</strong> Powdery mildew (white powder on leaves) or bud rot (brown/gray mushy spots)—lower humidity if you see this!<br /><br />

            <strong>Weeks 6-7 (Late Flower - Ripening):</strong><br />
            • Buds continue swelling—this is the bulk-up phase<br />
            • Pistils start changing from white to orange/brown (starting at the tops)<br />
            • Trichomes are milky/cloudy with very few amber<br />
            • Smell is extremely strong—neighbors will know if your filter fails<br />
            • <strong>Your job:</strong> Continue feeding, drop humidity to 40% or lower, increase airflow, check trichomes weekly with loupe<br />
            • <em>Some growers start flushing (plain water only) in week 7-8 for smoother smoke</em><br /><br />

            <strong>Weeks 8-10+ (Final Ripening & Harvest Window):</strong><br />
            • Most strains enter harvest window between weeks 8-10<br />
            • Pistils 60-90% brown/orange<br />
            • Trichomes transition from clear → cloudy → amber<br />
            • <strong>Harvest based on trichome color:</strong><br />
            &nbsp;&nbsp;• All cloudy, no amber: peak THC, energetic high<br />
            &nbsp;&nbsp;• 10-20% amber: balanced, most growers harvest here<br />
            &nbsp;&nbsp;• 30%+ amber: sedative, couch-lock effects<br />
            • <strong>Your job:</strong> Check trichomes daily, flush if desired (1-2 weeks plain water), prepare dry/cure area<br /><br />

            <Alert severity="info">
              <strong>How to Check Trichomes:</strong><br />
              Use a jeweler's loupe (60x magnification) or USB microscope. Look at trichomes on the buds themselves, NOT sugar leaves (they mature faster). You're looking for the mushroom-shaped glandular trichomes. Clear = not ready, Cloudy = peak potency, Amber = degrading THC into CBN (sedative).
            </Alert>
          </Section>

          <Section title="Environment & VPD in Flower - Critical for Quality">
            <strong>Temperature:</strong><br />
            • Day: 70-80°F (21-27°C) in early flower, drop to 65-75°F late flower<br />
            • Night: 5-10°F cooler than day temps (this temp swing brings out colors and terpenes)<br />
            • <em>Cool night temps in late flower can bring out purples, pinks, and enhance trichome production</em><br /><br />

            <strong>Humidity:</strong><br />
            • Weeks 1-3: 50-60% RH (still growing rapidly)<br />
            • Weeks 4-6: 45-50% RH (buds forming)<br />
            • Weeks 7+: 35-45% RH (prevent mold as buds thicken)<br />
            • <strong>Why it matters:</strong> High humidity + dense buds = bud rot (catastrophic!). Lower RH late in flower is your insurance policy<br /><br />

            <strong>VPD (Vapor Pressure Deficit):</strong><br />
            • Early flower: 1.0-1.4 kPa<br />
            • Mid-late flower: 1.2-1.6 kPa<br />
            • <em>VPD is the difference between humidity in the air vs. inside the leaf. It drives transpiration and nutrient uptake. Use a VPD chart or calculator online—it's a game changer!</em><br /><br />

            <strong>Airflow:</strong><br />
            • Keep air moving 24/7 with oscillating fans<br />
            • Air should gently rustle leaves, not bend stems<br />
            • <strong>Critical:</strong> Don't blow directly on dense buds late in flower—can cause wind burn or dry spots<br />
            • Exhaust fan should exchange all air in tent every 3-5 minutes
          </Section>

          <Section title="Feeding in Flower - Giving Your Buds What They Need">
            <strong>Bloom Nutrients:</strong><br />
            • Higher Phosphorus (P) and Potassium (K) for bud development<br />
            • Lower Nitrogen (N)—too much N in flower = airy buds and harsh smoke<br />
            • Add Cal-Mag every feeding if using RO water or LED lights (LEDs often cause Cal-Mag demand)<br /><br />

            <strong>Feeding Schedule:</strong><br />
            • Weeks 1-2: Transition nutrients (mix of veg + bloom) at 3/4 strength<br />
            • Weeks 3-7: Full-strength bloom nutrients<br />
            • Week 7-8+: Begin flushing with plain pH'd water (optional but popular for smoother smoke)<br />
            • <em>In coco/hydro: feed every time. In soil: feed every 2-3 waterings</em><br /><br />

            <strong>Boosters & Supplements:</strong><br />
            • <strong>PK boosters:</strong> Week 4-6 for added bud density (use as directed, easy to overdo)<br />
            • <strong>Carbohydrates:</strong> Feed the soil microbes, improve terpene production<br />
            • <strong>Silica:</strong> Strengthens cell walls, helps plants handle stress<br />
            • <em>Don't go crazy—a good base nutrient line is 90% of what you need</em><br /><br />

            <Alert severity="warning">
              <strong>Common Flower Problems & Fixes:</strong><br />
              • <strong>Bud rot (botrytis):</strong> Gray/brown mushy buds, spreads fast. Cut it out immediately (sterilize scissors between cuts), lower humidity, increase airflow. Don't smoke it!<br />
              • <strong>Powdery mildew:</strong> White powdery spots on leaves. Lower humidity, increase airflow, spray with diluted hydrogen peroxide or fungicide (avoid spraying buds directly).<br />
              • <strong>Nutrient burn:</strong> Leaf tips brown and crispy. Flush with plain water, reduce nutrient strength by 25-50%.<br />
              • <strong>Light burn/bleaching:</strong> Top buds turn white/yellow, leaves look crispy. Raise lights or reduce intensity.<br />
              • <strong>Foxtailing:</strong> Buds grow spiky towers. Caused by heat or genetics. Not a problem if genetic; reduce temps if heat-related.
            </Alert>
          </Section>

          <Section title="The Final Push: Weeks 8-10+">
            You're in the home stretch! This is when patience pays off. Many new growers harvest too early—don't be that person.<br /><br />

            <strong>Signs You're Getting Close:</strong><br />
            • 60-80% of pistils have darkened and curled in<br />
            • Buds feel firm and dense when gently squeezed<br />
            • Sugar leaves covered in trichomes<br />
            • Strong, pungent smell (make sure filter is working!)<br />
            • Some fan leaves yellowing (natural fade as plant uses stored nutrients)<br /><br />

            <strong>The Trichome Test (Final Word):</strong><br />
            This is the ONLY reliable way to time your harvest. Check multiple buds at different heights.<br />
            • <strong>Clear trichomes:</strong> Not ready—THC still developing<br />
            • <strong>Mostly cloudy/milky, few amber:</strong> Peak THC, head high, energetic<br />
            • <strong>10-30% amber:</strong> Balanced high, most popular harvest window<br />
            • <strong>30%+ amber:</strong> Heavy body high, sedative, risk of degraded THC<br /><br />

            <em>Pro tip: Different parts of the plant mature at different rates. Top buds ripen first. You can do a staggered harvest—take tops when ready, let lowers go another week.</em>
          </Section>
        </Box>
      )}

      {tab === 5 && (
        <Box>
          <Section title="Harvest: The Most Rewarding Day!">
            You've made it! After months of care, you're about to chop your first homegrown cannabis. This is exciting, but there's still important work to do it right.<br /><br />

            <strong>Final Pre-Harvest Steps:</strong><br />
            • <strong>48-72h darkness before chop (optional):</strong> Some growers believe this increases trichome production. Science is mixed, but it doesn't hurt.<br />
            • <strong>Stop feeding 1-2 weeks before harvest:</strong> Flush with plain pH'd water. This helps remove nutrient salts for smoother smoke.<br />
            • <strong>Check trichomes one last time:</strong> Make sure you're in your target window<br />
            • <strong>Prepare your drying space:</strong> 60°F, 50% RH, complete darkness, with gentle airflow<br /><br />

            <Alert severity="success" sx={{ mb: 2 }}>
              <strong>Best Time to Harvest:</strong><br />
              Early morning, right before lights come on. Terpenes are at peak concentration when it's cool and dark. Some growers swear by this for better smell and flavor!
            </Alert>
          </Section>

          <Section title="Harvest Day Process - Step by Step">
            <strong>Tools You Need:</strong><br />
            • Sharp, clean pruning shears or scissors<br />
            • Gloves (sticky resin will cover your hands!)<br />
            • Drying rack, hangers, or line to hang branches<br />
            • Labels for different strains/plants<br />
            • Turkey bags or brown paper bags for later stages<br /><br />

            <strong>Method 1: Whole Plant Hang (Easiest):</strong><br />
            1. Cut the main stem at the base<br />
            2. Remove large fan leaves (the big ones with no trichomes)<br />
            3. Hang entire plant upside down in dry space<br />
            • <em>Pros: Easiest, slowest dry (more time to cure), less handling</em><br />
            • <em>Cons: Takes more space, harder to control humidity</em><br /><br />

            <strong>Method 2: Branch by Branch (Most Common):</strong><br />
            1. Cut branches individually (8-12 inch sections)<br />
            2. Remove large fan leaves<br />
            3. Hang each branch on a line or rack<br />
            • <em>Pros: Better airflow, easier to manage different dry rates, fits in smaller spaces</em><br />
            • <em>Cons: More work, faster drying (watch carefully)</em><br /><br />

            <strong>Method 3: Wet Trim (Trimming Right After Harvest):</strong><br />
            1. Cut branches and remove ALL leaves while plant is fresh<br />
            2. Trim sugar leaves close to buds<br />
            3. Hang trimmed buds or place on drying rack<br />
            • <em>Pros: Easier to trim when wet, cleaner final product</em><br />
            • <em>Cons: Faster dry (can be too fast), can lose terpenes, more labor intensive</em><br /><br />

            <strong>Method 4: Dry Trim (My Recommendation):</strong><br />
            1. Hang branches with sugar leaves still on<br />
            2. Let dry for 7-10 days<br />
            3. Trim sugar leaves off after dry but before cure<br />
            • <em>Pros: Slower, more controlled dry. Better terpene retention. Easier to trim once dry.</em><br />
            • <em>Cons: Takes longer, trimming dry leaves can be tedious</em><br /><br />
          </Section>

          <Section title="Safety & Stealth During Harvest">
            • <strong>Smell:</strong> Harvest day is the SMELLIEST day. Fresh-cut cannabis reeks. Ensure carbon filter is running and doors/windows are managed.<br />
            • <strong>Scissors/tools:</strong> Sanitize between plants to avoid spreading any mold or pathogens<br />
            • <strong>Handling:</strong> Trichomes are delicate! Handle buds gently. The resin on your gloves is valuable (some growers collect "finger hash")<br />
            • <strong>Samples:</strong> Don't quick-dry and smoke fresh-cut bud expecting fire. It'll be harsh and not representative. Be patient for the cure!<br /><br />
          </Section>

          <HarvestAssistant />

          <Section title="What to Expect: Drying Timeline">
            <strong>Days 1-3:</strong> Buds feel wet/spongy. Strong smell. Don't trim yet!<br />
            <strong>Days 4-7:</strong> Outer leaves feel crispy, but buds still have moisture inside. Stems still bend, don't snap.<br />
            <strong>Days 7-10:</strong> Small stems start to snap (not bend). Buds feel dry on the outside but still have core moisture.<br />
            <strong>Day 10-14:</strong> Most buds are ready for trimming and curing. Stems snap cleanly. Buds feel dry but not brittle.<br /><br />

            <em><strong>The Snap Test:</strong> Bend a small stem. If it bends and doesn't snap, it needs more drying time. When it snaps cleanly, it's ready for cure. Don't rush this!</em>
          </Section>

          <Alert severity="warning">
            <strong>Common Harvest Mistakes:</strong><br />
            • <strong>Drying too fast:</strong> High temps, low humidity, too much airflow = hay smell, harsh smoke. Slow and low is the way!<br />
            • <strong>Drying too slow:</strong> Too humid, no airflow = mold. If you see mold, that bud is trash. Don't smoke it.<br />
            • <strong>Trimming wet when you should trim dry:</strong> You lose terpenes and it dries too fast<br />
            • <strong>Harvesting too early:</strong> Clear trichomes = weak effects. Be patient!<br />
            • <strong>Handling buds too much:</strong> You'll knock off trichomes. Gentle is the name of the game.
          </Alert>
        </Box>
      )}

      {tab === 6 && (
        <Box>
          <Section title="Dry & Cure: Turning Good Bud into Great Bud">
            <strong>Here's the truth:</strong> You can grow perfect plants, harvest at the ideal time, and still ruin your weed by rushing the dry and cure. This stage is just as important as the grow itself. Proper curing transforms harsh, grassy smoke into smooth, flavorful, potent flower. Let's do it right.<br /><br />
          </Section>

          <Section title="The Drying Phase (7-14 Days)">
            <strong>Environment is Everything:</strong><br />
            • <strong>Temperature:</strong> 60-70°F (ideal is 60-65°F). Cool and consistent.<br />
            • <strong>Humidity:</strong> 45-55% RH (ideal is 50%). Too low = too fast. Too high = mold risk.<br />
            • <strong>Darkness:</strong> Complete darkness preserves cannabinoids and terpenes. Light degrades THC.<br />
            • <strong>Airflow:</strong> Gentle circulation. Oscillating fan on low, NOT blowing directly on buds.<br />
            • <strong>No smell mitigation:</strong> Keep carbon filter running or use odor-absorbing gels. Your dry room will REEK.<br /><br />

            <Alert severity="info" sx={{ mb: 2 }}>
              <strong>Why 60/60 (60°F, 60% RH)?</strong><br />
              This is the gold standard. It creates the slowest, most controlled dry. Slow drying preserves terpenes (smell/flavor) and allows chlorophyll to break down naturally (no hay smell). If you can't hit 60°F, aim for the coolest stable temp you can manage.
            </Alert>

            <strong>Hanging Methods:</strong><br />
            • <strong>Whole plant:</strong> Hang upside down by the main stalk. Easiest but requires most space.<br />
            • <strong>Branches:</strong> Hang individual branches on wire, hangers, or racks. Most common method.<br />
            • <strong>Drying racks:</strong> Lay trimmed buds on mesh racks. Use only if you wet-trimmed—requires rotation daily.<br />
            • <em>Leave space between branches/buds. Overcrowding = mold risk.</em><br /><br />

            <strong>Daily Monitoring:</strong><br />
            • <strong>Check humidity and temp 2x daily</strong> with a hygrometer at bud level<br />
            • <strong>Rotate buds</strong> on racks if using that method<br />
            • <strong>Smell check:</strong> Should smell like weed, not mold or hay. If it smells musty = mold forming.<br />
            • <strong>Look for mold:</strong> White fuzz, gray spots, or dark splotches = throw it out immediately<br /><br />

            <strong>The Drying Timeline - What You'll Notice:</strong><br />
            • <strong>Day 1-2:</strong> Buds are heavy, wet, spongy. Leaves curl inward. Strong smell.<br />
            • <strong>Day 3-5:</strong> Outer layer dries. Sugar leaves feel crispy. Buds still squishy inside. Smell intensifies.<br />
            • <strong>Day 6-8:</strong> Buds feel drier but still have inner moisture. Small stems bend but don't snap. Getting close!<br />
            • <strong>Day 9-12:</strong> Small stems start to snap. Buds feel dry to touch but still have slight give. <strong>This is when most people jar up.</strong><br />
            • <strong>Day 13-14:</strong> For slower, longer dries (optimal). Main stems snap cleanly. Ready for trim and cure.<br /><br />

            <strong>When Is It Ready for Curing?</strong><br />
            Use the <strong>snap test:</strong> Bend a small branch/stem. If it bends = not ready. If it snaps with a clean break = ready!<br />
            • Buds should feel dry on the outside but not crumbly<br />
            • They should have a slight spring back when squeezed gently<br />
            • Smell should be strong but not wet/grassy<br /><br />

            <Alert severity="warning">
              <strong>Drying Too Fast? Emergency Fixes:</strong><br />
              • Raise humidity: Use a humidifier, place a small bowl of water in room (not near buds)<br />
              • Lower temperature if possible<br />
              • Reduce airflow (turn off fan or move it farther away)<br />
              • Consider jarring early and burping frequently (next section)
            </Alert>

            <Alert severity="error">
              <strong>Drying Too Slow? Mold Prevention:</strong><br />
              • Increase airflow gently<br />
              • Use a dehumidifier to bring RH down to 45-50%<br />
              • Space out branches more<br />
              • Check DAILY for mold. If you see any, remove that bud/branch immediately.
            </Alert>
          </Section>

          <Section title="The Curing Phase (2-8+ Weeks)">
            <strong>What is curing?</strong><br />
            Curing is a controlled aging process where moisture redistributes evenly through the bud, and chemical processes break down harsh compounds (chlorophyll, residual starches) while preserving cannabinoids and terpenes. The result: smoother smoke, better flavor, more potent effects.<br /><br />

            <strong>Jars & Containers:</strong><br />
            • <strong>Mason jars (quart or half-gallon) are perfect</strong>—airtight, cheap, reusable<br />
            • Glass only—no plastic bags or containers (they leach and don't seal properly)<br />
            • Fill jars 70-80% full (not packed tight)—you need air circulation<br />
            • Label jars with strain name and jar date<br /><br />

            <strong>The Burping Process:</strong><br />
            Burping means opening jars to release moisture and exchange air. This is crucial to prevent mold and allow the cure to progress.<br /><br />

            <strong>Week 1: Burp Daily</strong><br />
            • Open jars 1-2x per day for 5-15 minutes each time<br />
            • Gently shake/rotate jars to move buds around<br />
            • <strong>Check moisture:</strong> If buds feel wet or spongy, leave jar open longer (15-30 min) or remove buds and let air-dry for a few hours before re-jarring<br />
            • <strong>Smell check:</strong> Should smell like weed. If it smells like ammonia or mold, you have a problem (see troubleshooting below)<br /><br />

            <strong>Week 2: Burp Every 2-3 Days</strong><br />
            • Moisture has stabilized<br />
            • Open jars for 5-10 minutes<br />
            • Buds should feel evenly dry with slight sponginess when squeezed<br /><br />

            <strong>Week 3-4: Burp Weekly</strong><br />
            • You're in the cure sweet spot<br />
            • Open jars once a week, check for mold, give them a sniff<br />
            • At 3-4 weeks, your bud is smokable and enjoyable<br /><br />

            <strong>Month 2+: Long Cure (Optional but Recommended)</strong><br />
            • Burp monthly or just seal and forget<br />
            • Some strains peak at 6-8 weeks of cure<br />
            • Premium flower can cure for 3-6 months—flavors deepen and smooth out even more<br />
            • <strong>Pro tip:</strong> Jar your stash in weekly portions so you can enjoy the evolution of the cure<br /><br />

            <Alert severity="success">
              <strong>Perfect Cure Indicators:</strong><br />
              • Buds feel dry on the outside but slightly springy when squeezed<br />
              • No wet or sticky feeling<br />
              • Smell is strong, pleasant, and true to the strain<br />
              • Smoke is smooth with minimal harshness<br />
              • Effects are clear and potent
            </Alert>
          </Section>

          <Section title="Troubleshooting Cure Problems">
            <strong>Problem: Buds Feel Too Dry After Jarring</strong><br />
            • <strong>Solution:</strong> Add a Boveda or Integra Boost humidity pack (62% RH) to the jar. These regulate humidity perfectly.<br />
            • <strong>Or:</strong> Add a small piece of orange peel or lettuce leaf for 12-24 hours, then remove. Check daily to avoid mold.<br /><br />

            <strong>Problem: Buds Still Too Wet After 2 Weeks Jarred</strong><br />
            • <strong>Solution:</strong> Take buds out of jars and air-dry for 12-24 hours on a rack. Re-jar and resume burping schedule.<br />
            • <strong>Prevention:</strong> You jarred too early. Next time, dry longer before jarring.<br /><br />

            <strong>Problem: Ammonia Smell When Opening Jar</strong><br />
            • <strong>This is early-stage anaerobic bacteria!</strong> Not quite mold, but you're close.<br />
            • <strong>Solution:</strong> Remove all buds immediately and air-dry for 6-12 hours. Resume burping 2-3x daily for another week.<br />
            • <strong>Cause:</strong> Too much moisture, not enough burping.<br /><br />

            <strong>Problem: Visible Mold in Jar (White Fuzz, Gray/Black Spots)</strong><br />
            • <strong>This sucks, but don't smoke moldy weed.</strong> Health isn't worth it.<br />
            • <strong>If only one bud affected:</strong> Throw that bud out, inspect others carefully. Air-dry the rest for 24h and resume curing with more frequent burping.<br />
            • <strong>If multiple buds affected:</strong> The jar is compromised. Toss the moldy ones, dry the rest, and use them for edibles/concentrates (heat kills mold, but don't smoke it).<br /><br />

            <strong>Problem: Hay Smell Won't Go Away</strong><br />
            • <strong>Cause:</strong> Dried too fast, chlorophyll didn't break down properly<br />
            • <strong>Solution:</strong> Continue curing. It may improve slightly over 4-8 weeks, but damage is mostly done. Learn for next time: slow dry is key.<br /><br />

            <Alert severity="info">
              <strong>Boveda & Humidity Packs:</strong><br />
              Boveda 62% or Integra Boost packs are a game-changer for long-term storage. They maintain perfect RH automatically, so you can "set and forget" after the initial cure. One pack per quart jar. Replace every 3-6 months depending on use.
            </Alert>
          </Section>

          <Section title="Long-Term Storage (Months to Years)">
            Once your cure is complete (4+ weeks), you can store your flower long-term:<br /><br />

            <strong>Best Practices:</strong><br />
            • Keep in airtight glass jars with Boveda packs<br />
            • Store in a cool (60-70°F), dark place (closet, drawer)<br />
            • Avoid light, heat, and air exposure<br />
            • <strong>Properly stored cannabis can last 1-2 years</strong> with minimal degradation<br /><br />

            <strong>Freezing for Long-Term (1+ Year):</strong><br />
            • Vacuum seal buds in small portions<br />
            • Store in freezer at 0°F or below<br />
            • <strong>Do not open/thaw repeatedly</strong>—moisture will condense and ruin quality<br />
            • When ready to use, thaw slowly at room temp in the sealed bag<br /><br />

            <em>Most homegrowers don't need to freeze unless you harvested pounds and want to preserve it for a year+. Proper jar curing is plenty for most stashes.</em>
          </Section>

          <Alert severity="success" sx={{ mt: 2 }}>
            <strong>Patience Pays Off:</strong><br />
            The difference between a 1-week dry-rushed-to-jar and a 2-week dry + 4-week cure is night and day. Your buds will be smoother, tastier, and more potent. This is where good weed becomes GREAT weed. Don't skip it!
          </Alert>
        </Box>
      )}

      {tab === 7 && (
        <Box>
          <Section title="Watering Guide">
            • Water when top inch of soil is dry; pot feels light<br />
            • Aim for 10–20% runoff; ensure proper drainage<br />
            • pH 6.0–6.5 (soil), 5.8–6.2 (coco)
          </Section>
          <Section title="Signs of Over/Underwatering">
            • Overwater: droopy leaves, slow growth, saturated medium—extend dry-back.<br />
            • Underwater: wilting that perks up after watering—increase frequency/volume.
          </Section>
        </Box>
      )}

      {tab === 8 && (
        <Box>
          <Section title="Nutrients & Deficiencies">
            • Start light (¼–½ strength). Increase slowly based on plant response.<br />
            • N excess: very dark green, clawing. P/K excess: leaf tip burn, lockout.
          </Section>
          <Section title="Common Issues">
            • Nitrogen deficiency: lower leaves yellowing—feed veg nutrients.<br />
            • Cal/Mag deficiency: rust spots/interveinal chlorosis—add Cal-Mag.
          </Section>
        </Box>
      )}

      {tab === 9 && (
        <Box>
          <Section title="Pests & IPM">
            • Prevention: cleanliness, quarantine new plants, sticky traps.<br />
            • Common pests: spider mites, thrips, fungus gnats—identify early.<br />
            • Response: mechanical removal, beneficial insects, targeted sprays (as allowed).
          </Section>
        </Box>
      )}

      {tab === 10 && (
        <Box>
          <Section title="Schedules & Checklists">
            • Weekly: inspect leaves (top/bottom), prune, adjust light height, log temp/RH.<br />
            • Before flip: defoliate lightly, confirm timer 12/12, swap to bloom nutrients.<br />
            • Late flower: reduce RH, check trichomes, prepare dry space.
          </Section>
        </Box>
      )}
    </Container>
  );
}

function HarvestAssistant() {
  const [days, setDays] = useState(56);
  const [amber, setAmber] = useState(10); // % amber trichomes
  const [pistils, setPistils] = useState(60); // % brown pistils

  const readinessScore = (() => {
    // Weight trichomes most, pistils next, days least (varies by cultivar)
    const daysScore = Math.min(1, Math.max(0, (days - 49) / 21)); // 7–10 weeks window
    const amberScore = Math.min(1, amber / 20); // 0–20% amber caps at ready
    const pistilScore = Math.min(1, pistils / 70); // 70%+ brown generally ready
    return 0.6 * amberScore + 0.3 * pistilScore + 0.1 * daysScore;
  })();

  let verdict = 'Too early';
  let note = 'Keep feeding and monitoring. Aim for cloudy trichomes with a touch of amber.';
  if (readinessScore > 0.85) {
    verdict = 'Ready';
    note = 'Chop within the next few days for peak potency and balanced effects.';
  } else if (readinessScore > 0.65) {
    verdict = 'Approaching';
    note = 'You are close—check daily. Expect harvest in 3–7 days.';
  } else if (amber >= 25 || days >= 84) {
    verdict = 'Past prime';
    note = 'Effects may become heavier/sedative. Harvest ASAP to avoid degradation.';
  }

  return (
    <Paper elevation={0} sx={{ p: 2, mt: 2, background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(6px)', border: '1px solid rgba(255,255,255,0.12)' }}>
      <Typography variant="subtitle1" fontWeight={800} gutterBottom>
        Harvest Assistant
      </Typography>
      <Alert severity="info" sx={{ mb: 2 }}>
        <strong>Tip:</strong> "12/12" refers to the 12-hour light / 12-hour dark cycle that triggers flowering. Count days from when you switched your lights to this schedule.
      </Alert>
      <Grid container spacing={2}>
        <Grid item size={{ xs: 12, sm: 4 }}>
          <Typography variant="caption" sx={{ color: '#000' }}>Days in flowering (since 12/12 light flip)</Typography>
          <Slider value={days} onChange={(_, v) => setDays(v)} min={35} max={100} step={1} valueLabelDisplay="auto" sx={{ mt: 1 }} />
          <Typography variant="body2" sx={{ color: '#000' }}>{days} days</Typography>
        </Grid>
        <Grid item size={{ xs: 12, sm: 4 }}>
          <Typography variant="caption" sx={{ color: '#000' }}>Amber trichomes (%)</Typography>
          <Slider value={amber} onChange={(_, v) => setAmber(v)} min={0} max={40} step={1} valueLabelDisplay="auto" sx={{ mt: 1 }} />
          <Typography variant="body2" sx={{ color: '#000' }}>{amber}%</Typography>
        </Grid>
        <Grid item size={{ xs: 12, sm: 4 }}>
          <Typography variant="caption" sx={{ color: '#000' }}>Brown pistils (%)</Typography>
          <Slider value={pistils} onChange={(_, v) => setPistils(v)} min={0} max={100} step={1} valueLabelDisplay="auto" sx={{ mt: 1 }} />
          <Typography variant="body2" sx={{ color: '#000' }}>{pistils}%</Typography>
        </Grid>
      </Grid>

      <Alert severity={verdict === 'Ready' ? 'success' : verdict === 'Approaching' ? 'info' : verdict === 'Past prime' ? 'warning' : 'info'} sx={{ mt: 2 }}>
        <strong>{verdict}.</strong> {note}
      </Alert>

      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle2" gutterBottom sx={{ color: '#000' }}>Day-of-harvest checklist</Typography>
        <Typography variant="body2" sx={{ color: '#000' }}>
          • 24–48h dark (optional) • Flush/stop feed appropriately • Clean shears and surfaces • Prep dry area (60°F, 50% RH) • Label branches by cultivar
        </Typography>
      </Box>
    </Paper>
  );
}
