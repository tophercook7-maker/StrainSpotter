import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Divider,
  Grid,
  Paper,
  Slider,
  Stack,
  Tab,
  Tabs,
  Typography
} from '@mui/material';
import {
  ArrowBack,
  BugReport,
  Checklist,
  Engineering,
  Grain,
  LocalFlorist,
  MenuBook,
  MonitorHeart,
  Opacity,
  Science,
  Spa,
  Timeline,
  NoteAlt,
  WaterDrop,
  WbSunny
} from '@mui/icons-material';
import GrowLogBook from './GrowLogBook';

function Section({ title, children }) {
  return (
    <Box
      sx={{
        mb: 3,
        p: 2,
        borderRadius: 3,
        backgroundColor: 'rgba(255,255,255,0.95)',
        border: '1px solid rgba(0,0,0,0.08)',
        boxShadow: '0 6px 18px rgba(20,40,20,0.08)'
      }}
    >
      <Typography variant="subtitle1" fontWeight={800} gutterBottom sx={{ color: '#000' }}>
        {title}
      </Typography>
      <Typography variant="body2" sx={{ color: '#000' }}>
        {children}
      </Typography>
    </Box>
  );
}

export const LOGBOOK_TAB_INDEX = 13;

export default function GrowCoach({ onBack, initialTab = 0 }) {
  const [tab, setTab] = useState(initialTab);
  const [timelineIndex, setTimelineIndex] = useState(0);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  const overviewSections = useMemo(
    () => [
      {
        title: 'The Four Pillars of Success',
        body: (
          <>
            <strong>Environment:</strong> Hold temperature, humidity, VPD, airflow, and CO₂ inside target ranges for every stage. Stable rooms prevent most problems.<br /><br />
            <strong>Genetics:</strong> Choose cultivars that fit your ceiling height, flowering window, and desired chemotype. Verify breeder data, germination rates, and lab tests.<br /><br />
            <strong>Nutrition & Water:</strong> Deliver balanced feed at the correct EC and pH. Adjust based on runoff data and leaf feedback instead of bottle recommendations alone.<br /><br />
            <strong>Observation & Logging:</strong> Inspect plants daily, record metrics, and photograph everything. Consistent logs unlock AI-driven insights and make troubleshooting fast.
          </>
        )
      },
      {
        title: 'Baseline Targets',
        body: (
          <>
            <Grid container spacing={2}>
              {[
                { stage: 'Seedling', temp: '75-80°F', rh: '65-75% RH', vpd: '0.4-0.8 kPa', light: '200-300 PPFD (18-24 hrs)' },
                { stage: 'Vegetative', temp: '76-82°F', rh: '55-65% RH', vpd: '1.0-1.2 kPa', light: '350-550 PPFD (18/6 or 20/4)' },
                { stage: 'Early Flower', temp: '76-80°F', rh: '45-55% RH', vpd: '1.1-1.3 kPa', light: '650-750 PPFD (12/12)' },
                { stage: 'Mid/Late Flower', temp: '74-78°F', rh: '40-50% RH', vpd: '1.2-1.4 kPa', light: '750-900 PPFD (12/12)' },
                { stage: 'Dry + Cure', temp: '60-65°F', rh: '55-60% RH', vpd: '0.7-0.8 kPa', light: 'Complete darkness' }
              ].map((row) => (
                <Grid item xs={12} sm={6} key={row.stage}>
                  <Paper elevation={0} sx={{ p: 2, borderRadius: 3, background: 'rgba(255,255,255,0.96)', border: '1px solid rgba(0,0,0,0.06)' }}>
                    <Typography variant="subtitle2" fontWeight={700}>{row.stage}</Typography>
                    <Typography variant="body2">Temperature: {row.temp}</Typography>
                    <Typography variant="body2">Humidity: {row.rh}</Typography>
                    <Typography variant="body2">VPD: {row.vpd}</Typography>
                    <Typography variant="body2">Lighting: {row.light}</Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </>
        )
      },
      {
        title: 'Core Equipment Checklist',
        body: (
          <>
            <strong>Space:</strong> 2×2–4×4 reflective tent, inline exhaust + carbon filter (CFM ≥ tent volume ×1.25), passive or filtered active intake, oscillating clip fans for canopy and under-canopy airflow.<br /><br />
            <strong>Lighting:</strong> Full-spectrum dimmable LED (PPF ≥2.4 µmol/J) with timer/smart plug. Reference manufacturer PPFD map to set hanging height.<br /><br />
            <strong>Mediums:</strong> Fabric pots (3–7 gal). Choose living soil (amended), coco/perlite (70/30), or soilless peat. Always use quality water (RO or filtered tap + Cal-Mag as required).<br /><br />
            <strong>Monitoring:</strong> Calibrated pH pen, EC/TDS meter, hygrometer/thermometer at canopy, jeweler’s loupe (60×), optional Bluetooth sensors for remote logging.<br /><br />
            <strong>Supplies:</strong> Two- or three-part base nutrients, silica, Cal-Mag, microbial inoculant, IPM toolkit (biologicals, neem alternatives), enzyme or flushing solution, scissors, alcohol wipes.<br /><br />
            <strong>Automation Ready:</strong> Smart plugs, leak trays, Wi-Fi sensors, StrainSpotter Grow Log templates for daily data capture.
          </>
        )
      },
      {
        title: 'Your First Cycle Roadmap',
        body: (
          <>
            <strong>Week 0:</strong> Sanitize space, assemble equipment, run empty test for 24 hours.<br />
            <strong>Weeks 1-2:</strong> Germinate, establish seedlings, record emergence.<br />
            <strong>Weeks 3-6:</strong> Vegetative growth, training, transplant, canopy leveling.<br />
            <strong>Weeks 7-16:</strong> Flower stretch, bud formation, bulking, ripening.<br />
            <strong>Weeks 17-18:</strong> Harvest, dry, cure, and review analytics for next run.<br /><br />
            Pair this roadmap with the Stage Timelines tab for detailed weekly objectives.
          </>
        )
      }
    ],
    []
  );

  const setupSections = useMemo(
    () => [
      {
        title: 'Space & Environmental Control',
        body: (
          <>
            • Position tent away from direct sunlight and HVAC vents; ensure dedicated electrical circuit.<br />
            • Calculate exhaust fan size: <em>CFM = tent volume × air exchange target (1.25-1.5)</em>. Add 25% headroom for filter resistance.<br />
            • Configure air path: passive lower intake or filtered active intake; carbon filter at canopy height exhausting outdoors or into lung room.<br />
            • Install two oscillating fans (above and below canopy) for gentle non-stop airflow.<br />
            • Lightproof the space—patch pinholes with foil tape, double up flaps to prevent light leaks during flower.
          </>
        )
      },
      {
        title: 'Medium Recipes',
        body: (
          <>
            <strong>Living Soil (per 10 gal):</strong> 5 gal sphagnum peat, 3 gal aeration (pumice/perlite), 2 gal compost. Amend with 2 cups kelp meal, 2 cups neem/karanja, 2 cups crustacean meal, 1 cup gypsum, 1 cup basalt, 1 cup dolomite lime. Moisture to field capacity, rest 2-4 weeks, inoculate with mycorrhizae at transplant.<br /><br />
            <strong>Coco/Perlite 70/30:</strong> Rinse buffered coco until runoff EC &lt;0.6 mS/cm, mix with medium perlite. Feed 1.0 EC from day one, 10-15% runoff each watering, maintain root-zone pH 5.8-6.2.<br /><br />
            <strong>Soilless Peat (Pro-Mix style):</strong> 80% peat, 20% perlite with mycorrhizae. Requires full nutrient program similar to coco but slower dryback. Maintain pH 6.0-6.3.
          </>
        )
      },
      {
        title: 'Containers & Irrigation',
        body: (
          <>
            • Fabric pots promote air pruning and faster oxygen exchange; pair with saucers and risers.<br />
            • Plastic pots retain moisture longer—reduce watering frequency or increase airflow.<br />
            • Automated options: drip rings, Blumat carrots, or ebb-and-flow trays. Log irrigation events and volumes in StrainSpotter.<br />
            • Sterilise irrigation lines monthly; flush with 3% peroxide solution during turnaround.
          </>
        )
      },
      {
        title: 'Monitoring & Calibration',
        body: (
          <>
            • Place hygrometer at canopy height and second sensor near root zone to monitor gradients.<br />
            • Calibrate pH pen weekly if high-use; store probe in KCl solution, never dry.<br />
            • Rinse EC meter with RO after use; calibrate monthly with 1413 µS/cm solution.<br />
            • Log calibration dates, filter changes, and cleanings for compliance.<br />
            • Use lux meter (or reliable phone app) with conversion factor (lux × 0.015 ≈ PPFD for white LEDs) when PAR meter absent.
          </>
        )
      },
      {
        title: 'Automation & Data Readiness',
        body: (
          <>
            • Connect smart plugs to StrainSpotter webhook for automated light cycle logging.<br />
            • Install Wi-Fi or Bluetooth sensors and sync to mobile dashboards for instant alerts.<br />
            • Build a StrainSpotter daily log template capturing: ambient temp, RH, CO₂, irrigation volume, input EC/pH, runoff EC/pH, observations.<br />
            • Photograph final setup (lights on/off) and upload to AI for placement review (fan orientation, light height, potential hotspots).
          </>
        )
      }
    ],
    []
  );

  const germinationSections = useMemo(
    () => [
      {
        title: 'Germination Workflow (Days 0-7)',
        body: (
          <>
            1. <strong>Hydrate:</strong> Soak seeds 12-18 hours in 68-70°F filtered water (dark environment). Seeds often sink after a few hours—floating seeds can be coaxed under.<br />
            2. <strong>Incubate:</strong> Transfer to moist (not soaked) paper towels between plates or inside a germination tray. Maintain 75-80°F and 70-80% RH.<br />
            3. <strong>Monitor:</strong> Check twice daily. Keep towels damp. Wait for 0.25-0.5 inch taproot before planting.<br />
            4. <strong>Plant:</strong> Place taproot-down in pre-moistened medium 0.25-0.5 inch deep. Cover lightly and mist surface.<br />
            5. <strong>Acclimate:</strong> Use humidity dome for first 3-5 days, vent gradually to harden seedlings.<br /><br />
            Track seed lot, soak time, and sprout date in StrainSpotter to build cultivar-specific averages.
          </>
        )
      },
      {
        title: 'Environmental Targets',
        body: (
          <>
            • Temperature 75-80°F, RH 70-80%, gentle airflow directed above seedlings.<br />
            • Lighting 18-24 hours per day, ~200 PPFD at canopy, LED 24-30 inches away.<br />
            • Media moisture: evenly moist but never waterlogged. Mist surface daily; allow top layer to dry between waterings to prevent damping-off.<br />
            • Avoid fertiliser until first true leaves emerge; use pH 6.0-6.2 water (or 5.8 in coco).
          </>
        )
      },
      {
        title: 'Troubleshooting Germination',
        body: (
          <>
            • Seed fails to crack after 48 hours: gently scarify with fine sandpaper, re-soak 12 hours, retry.<br />
            • Taproot stalls: temperature likely low—move incubator to 78°F zone.<br />
            • Helmet head: mist husk, wait 30 minutes, use sterile tweezers to ease shell off.<br />
            • Stretching seedling: increase light intensity or lower fixture; support stem with a small stake.<br />
            • Leaf spotting: photograph and run through StrainSpotter AI to confirm whether it is splash, deficiency, or pathogen.
          </>
        )
      },
      {
        title: 'AI & Data Touchpoints',
        body: (
          <>
            • Log emergence date and cultivar inside Grow Log to populate later-stage timelines automatically.<br />
            • Upload day 3 and day 7 photos—AI flags stretch, colour deviations, or early deficiency signals.<br />
            • Record irrigation volume and intervals; AI will calculate dryback rate to inform veg watering schedule.
          </>
        )
      }
    ],
    []
  );

  const vegetativeSections = useMemo(
    () => [
      {
        title: 'Environmental & Nutrient Targets',
        body: (
          <>
            • Lighting: 18/6 or 20/4. Provide 350-550 PPFD. Maintain LED 18-24 inches above canopy.<br />
            • Temperature: 76-82°F day / 70-72°F night. RH 55-65% (VPD 1.0-1.2 kPa).<br />
            • Feeding: EC 1.0-1.4 depending on medium. Maintain N:K ratio around 3:2. Always include calcium/magnesium under LED lighting.<br />
            • Watering: allow 10-20% runoff in coco; in soil water when top inch dry. Alternate feed/water as required by runoff data.
          </>
        )
      },
      {
        title: 'Training Protocol',
        body: (
          <>
            • Week 3: Top above node 4 or 5. Begin low-stress training (LST) to spread canopy.<br />
            • Week 4: Install SCROG net 8-10 inches above pots. Tuck branches daily to maintain level canopy.<br />
            • Week 5: Remove interior growth/shaded shoots receiving &lt;200 PPFD. Maintain airflow through centre.<br />
            • Week 6: Final canopy leveling. Ensure even height before transition to 12/12. Document training actions with photos.
          </>
        )
      },
      {
        title: 'Weekly Checklist',
        body: (
          <>
            • Inspect foliage (top/bottom) for pests, deficiencies, mechanical damage.<br />
            • Clean and sterilise scissors, ties, and support stakes.<br />
            • Recalibrate sensors and meters once per week.<br />
            • Photograph canopy top-down for AI analysis of light distribution.<br />
            • Record plant height, node count, training adjustments, and irrigation data inside StrainSpotter.
          </>
        )
      },
      {
        title: 'AI Utilisation',
        body: (
          <>
            • Weekly StrainSpotter Scan of canopy to detect colour shift, tip burn, or early nutrient issues.<br />
            • Prompt example: “Predict final harvest height with veg height 18 inches and cultivar stretch factor 2×.”<br />
            • Upload canopy map; AI suggests additional tie-down points or defoliation targets.
          </>
        )
      }
    ],
    []
  );

  const floweringSections = useMemo(
    () => [
      {
        title: 'Transition (Weeks 1-3 of Flower)',
        body: (
          <>
            • Switch to 12/12 photoperiod; optionally add 15-minute far-red flash at lights-off to reduce stretch.
            • Increase PPFD to 650-750; adjust fixture height daily during stretch.
            • Maintain temperature 76-80°F day / 68-70°F night; RH 45-55% (VPD 1.1-1.3 kPa).
            • Transition feed over 7-10 days: reduce nitrogen, increase phosphorus/potassium gradually.
            • Install second trellis or plant yoyos once stretch exceeds 6 inches.
            • Scout daily for powdery mildew and pest pressure; document observations in Grow Log.
          </>
        )
      },
      {
        title: 'Mid Flower (Weeks 4-7)',
        body: (
          <>
            • Hold PPFD 750-850; CO₂ (if supplementing) 900-1000 ppm during lights-on.
            • Maintain RH 40-50% to prevent botrytis; increase airflow beneath canopy.
            • Feed EC 1.4-1.8 depending on cultivar response; monitor runoff to keep input-output EC differential ≤0.3.
            • Perform single targeted defoliation at start of week 4 to open airflow; avoid repeated heavy stripping.
            • Record bud development photos weekly; AI compares to cultivar norms and flags lagging cola growth.
          </>
        )
      },
      {
        title: 'Late Flower & Ripening (Weeks 8+)',
        body: (
          <>
            • Begin ripening flush 10-14 days before planned harvest (RO or finishing solution). Aim for runoff EC &lt;0.6 mS/cm by final days.
            • Lower night temperature to 65-68°F to preserve volatile terpenes and tighten buds.
            • Reduce RH to 38-45%; ensure dehumidifier sized to handle transpiration load.
            • Inspect trichomes with 60× loupe: clear → cloudy indicates peak potency; aim for 5-10% amber for balanced effect unless cultivar-specific.
            • Secure heavy branches with yoyos. Eliminate light leaks to avoid foxtailing or re-veg.
          </>
        )
      },
      {
        title: 'AI & Data Touchpoints',
        body: (
          <>
            • Upload weekly macro photos—AI detects early botrytis, nutrient tip burn, or foxtail formation.
            • Prompt example: “Provide harvest readiness checklist for cultivar X at week 8 with 20% amber trichomes.”
            • Record aroma notes and environmental deltas; AI correlates data with final terpene profile.
          </>
        )
      }
    ],
    []
  );

  const harvestSections = useMemo(
    () => [
      {
        title: 'Harvest Preparation',
        body: (
          <>
            • Stop foliar sprays minimum 14 days pre-harvest.<br />
            • Clean trimming tools with isopropyl alcohol; prepare gloves, trays, drying lines.<br />
            • Plan dark period: 24-36 hours darkness optional for terpene preservation (ensure environment stable).<br />
            • Verify drying space conditions: 60°F ±2°, 55-60% RH, gentle air exchange, total darkness.
          </>
        )
      },
      {
        title: 'Cutting & Initial Processing',
        body: (
          <>
            • Harvest just before lights-on to maximise terpene retention.<br />
            • Remove large fan leaves immediately; optional wet trim to reduce drying RH load.<br />
            • Hang branches evenly spaced with good airflow; avoid bud-to-bud contact.<br />
            • Label each cultivar batch with harvest date, cultivar, phenotypic notes.<br />
            • Log wet weight per plant for yield tracking (wet weight ×0.20 ≈ expected dry weight).
          </>
        )
      },
      {
        title: 'AI Support',
        body: (
          <>
            • Upload harvest photos for AI to verify bud density, potential mould, or trim quality.<br />
            • Prompt example: “Confirm if these trichomes show optimal maturity for sedative effect.”
          </>
        )
      }
    ],
    []
  );

  const dryCureSections = useMemo(
    () => [
      {
        title: 'Drying (Days 1-10)',
        body: (
          <>
            • Maintain 60°F / 55-60% RH with slow air exchange; no direct fans on buds.<br />
            • Inspect daily for mould, adjust RH ±2% as needed to keep 7-10 day dry time.<br />
            • Check small branches: when they snap (not bend), move to trimming.<br />
            • Log dry-room temp/RH daily; AI monitors for deviations that risk terpene loss.
          </>
        )
      },
      {
        title: 'Curing (Day 10+)',
        body: (
          <>
            • Trim buds cleanly; store in airtight glass jars filled 65-70% (allow headspace).
            • Initial cure: burp jars 10 minutes twice daily for first 3 days, then once daily for days 4-7, every other day thereafter.
            • Use humidity packs (58-62%) once jar RH stable at 58-60%.
            • Cure for minimum 21 days before full evaluation; premium cure 6-8 weeks.
            • Record jar RH with digital mini-hygrometer; log terpene/aroma notes in StrainSpotter.
          </>
        )
      },
      {
        title: 'Quality Assurance',
        body: (
          <>
            • Test small sample for moisture using hygrometer or moisture meter (target 11-13%).
            • Upload cured bud photos—AI evaluates trim quality, mould risk, and bag appeal.
            • Prompt example: “Suggest corrective steps: jar RH 66% with grassy aroma at day 5 of cure.”
          </>
        )
      }
    ],
    []
  );

  const wateringSections = useMemo(
    () => [
      {
        title: 'Water Source & Conditioning',
        body: (
          <>
            • Use reverse osmosis or filtered tap (ensure chlorine/chloramine removal).<br />
            • Ideal input temperature 65-70°F to maintain dissolved oxygen.<br />
            • For living soil, dechlorinate by aerating water 24 hours or using Campden tablet.<br />
            • Record water source, EC, and pH before mixing nutrients.
          </>
        )
      },
      {
        title: 'Watering Techniques by Medium',
        body: (
          <>
            <strong>Soil:</strong> Water when top inch dry; saturate until 10-20% runoff. Allow full dryback (pot light) before next irrigation.<br /><br />
            <strong>Coco:</strong> Feed every watering, every 1-2 days early veg then daily in late veg/flower. Always achieve 10-15% runoff to prevent salt buildup.<br /><br />
            <strong>Hydro:</strong> Maintain reservoir temps 66-68°F, dissolved oxygen &gt;6 ppm, refresh nutrient solution weekly.
          </>
        )
      },
      {
        title: 'Soil Moisture Monitoring',
        body: (
          <>
            • Use pot weight method (lift pots) or soil moisture probes for consistency.<br />
            • Record irrigation volume, EC, pH, and runoff data in StrainSpotter; AI spots overwatering trends.<br />
            • Integrate volumetric water sensors (optional) to stream data into mobile dashboard.
          </>
        )
      }
    ],
    []
  );

  const nutrientSections = useMemo(
    () => [
      {
        title: 'Feeding Strategy',
        body: (
          <>
            • Base nutrients: follow manufacturer schedule at 30-50% strength initially; adjust using runoff EC and plant response.<br />
            • Maintain veg pH 5.8-6.2 (coco/hydro) or 6.2-6.8 (soil). Flower pH 5.8-6.3 / 6.2-6.7 respectively.<br />
            • Alternate feed/water or feed/feed/water depending on runoff EC trends.<br />
            • Add silica in veg/early flower, Cal-Mag as needed, beneficial bacteria weekly.
          </>
        )
      },
      {
        title: 'Deficiency & Toxicity Quick Reference',
        body: (
          <>
            <Grid container spacing={2}>
              {[
                { name: 'Nitrogen', deficiency: 'Uniform yellowing of lower leaves, slow growth.', toxicity: 'Very dark leaves, clawing, fragile stems.' },
                { name: 'Phosphorus', deficiency: 'Dark, dull leaves with purple stems, slow budding.', toxicity: 'Nutrient lockout causing micronutrient deficiencies.' },
                { name: 'Potassium', deficiency: 'Leaf edge burn, weak stems, poor bud set.', toxicity: 'Lockout of calcium and magnesium, crispy leaves.' },
                { name: 'Calcium', deficiency: 'Rust spots on new growth, twisted leaves.', toxicity: 'Rare, usually manifests as high EC runoff.' },
                { name: 'Magnesium', deficiency: 'Interveinal yellowing on older leaves.', toxicity: 'Can antagonise calcium uptake.' }
              ].map((row) => (
                <Grid item xs={12} sm={6} key={row.name}>
                  <Paper elevation={0} sx={{ p: 2, borderRadius: 3, background: 'rgba(255,255,255,0.96)', border: '1px solid rgba(0,0,0,0.06)' }}>
                    <Typography variant="subtitle2" fontWeight={700}>{row.name}</Typography>
                    <Typography variant="body2"><strong>Deficiency:</strong> {row.deficiency}</Typography>
                    <Typography variant="body2"><strong>Toxicity:</strong> {row.toxicity}</Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </>
        )
      },
      {
        title: 'AI Troubleshooting Workflow',
        body: (
          <>
            • Capture close-up and whole-plant photos; upload to StrainSpotter AI to classify issue (deficiency vs toxicity vs pest).<br />
            • Log corrective action (feed adjustment, flush, foliar) and follow up with photo 48 hours later to confirm improvement.<br />
            • Prompt example: “Run diagnostic: week 5 flower, EC 1.6 input/2.0 runoff, leaf edges burnt.”
          </>
        )
      }
    ],
    []
  );

  const pestSections = useMemo(
    () => [
      {
        title: 'Integrated Pest Management (IPM) Baseline',
        body: (
          <>
            • Keep room clean; remove plant waste immediately, sterilise tools regularly.<br />
            • Quarantine new clones for 10-14 days; treat preventatively before entering main space.<br />
            • Apply biologicals (Bacillus subtilis, beneficial mites) on schedule—alternate modes of action.
          </>
        )
      },
      {
        title: 'Common Pests & Responses',
        body: (
          <>
            <Grid container spacing={2}>
              {[
                { pest: 'Spider Mites', sign: 'Speckled leaves, webbing under leaves.', action: 'Increase humidity temporarily, spray with horticultural oil or release predatory mites (Phytoseiulus persimilis).' },
                { pest: 'Fungus Gnats', sign: 'Tiny flies, larvae in topsoil.', action: 'Allow top layer to dry, top-dress with GnatNix, apply Bacillus thuringiensis israelensis (BTi).' },
                { pest: 'Powdery Mildew', sign: 'White powder on leaves.', action: 'Lower humidity, increase airflow, apply potassium bicarbonate or biological fungicide. Remove infected leaves.' },
                { pest: 'Bud Rot (Botrytis)', sign: 'Gray mould inside buds.', action: 'Remove infected material immediately, lower RH to &lt;45%, increase airflow, consider hydrogen peroxide spray on surrounding area.' }
              ].map((row) => (
                <Grid item xs={12} sm={6} key={row.pest}>
                  <Paper elevation={0} sx={{ p: 2, borderRadius: 3, background: 'rgba(255,255,255,0.96)', border: '1px solid rgba(0,0,0,0.06)' }}>
                    <Typography variant="subtitle2" fontWeight={700}>{row.pest}</Typography>
                    <Typography variant="body2"><strong>Signs:</strong> {row.sign}</Typography>
                    <Typography variant="body2"><strong>Response:</strong> {row.action}</Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </>
        )
      },
      {
        title: 'AI-Assisted Monitoring',
        body: (
          <>
            • Use macro lens attachments on mobile to capture pest images; upload to StrainSpotter for classification and treatment recommendations.<br />
            • Log every spray/application with date, product, rate, and coverage; AI ensures rotation of active ingredients.<br />
            • Prompt example: “Identify cause: Week 6 flower, RH 48%, white spots underside leaves.”
          </>
        )
      }
    ],
    []
  );

  const timeline = useMemo(
    () => [
      {
        label: 'Week 0',
        stage: 'Pre-Plant Planning',
        focus: 'Select genetics, prep environment, sterilise tools.',
        tasks: [
          'Review grow goals: yield target (g/watt), cannabinoid profile, flowering length.',
          'Select genetics suited to space height and flowering duration; order seeds/clones from vetted suppliers.',
          'Sanitise grow space with 3% hydrogen peroxide or 1:10 bleach solution; dry thoroughly.',
          'Verify electrical load capacity and timer accuracy; install surge protection.',
          'Calibrate pH and EC meters; record calibration date in log.'
        ],
        aiPrompts: [
          '“Recommend three cultivars for 8 ft ceiling, 9-week flower, balanced THC:CBD.”',
          'Upload previous harvest images for AI review; note phenotype traits to replicate or avoid.'
        ],
        metrics: ['Room temp 68-72°F empty', 'RH 45-55%', 'Baseline VPD 1.0-1.2 kPa']
      },
      {
        label: 'Week 1',
        stage: 'Germination & Emergence',
        focus: 'Even germination, gentle environment.',
        tasks: [
          'Hydrate seeds 12-18 hours, incubate in moist paper towel at 78°F.',
          'Transfer to medium once taproot 0.25-0.5 inches; label cultivar and date.',
          'Maintain humidity dome 70-80% until cotyledons fully open.',
          'Provide 18-24 hour light at ~200 PPFD; ensure gentle airflow above seedlings.',
          'Log emergence dates in StrainSpotter to start growth timeline.'
        ],
        aiPrompts: [
          '“Is this seedling stretching? Suggest light distance adjustment.”',
          'Upload seedling photo to confirm healthy colour and cotyledon shape.'
        ],
        metrics: ['Temp 75-80°F', 'RH 70-80%', 'pH 5.8-6.2', 'EC ≤0.4']
      },
      {
        label: 'Week 2',
        stage: 'Seedling Establishment',
        focus: 'Root expansion, prepare for transplant.',
        tasks: [
          'Remove humidity dome; increase gentle airflow to prevent damping-off.',
          'Water 5-10% pot volume with pH 6.0, 150-200 ppm solution (or dechlorinated water for amended soil).',
          'Transplant into solo cups or 1-gal pots once roots circle starter cube.',
          'Introduce low-stress training anchors (soft wire) to prepare for future training.',
          'Record first true leaf size and colour in log.'
        ],
        aiPrompts: [
          '“Calculate dryback time for 1-gal coco at 78°F with 55% RH.”',
          'Upload leaf photo to distinguish splash marks vs deficiency.'
        ],
        metrics: ['Temp 75-80°F', 'RH 60-70%', 'VPD 0.8-1.0 kPa']
      },
      {
        label: 'Weeks 3-4',
        stage: 'Vegetative Ramp',
        focus: 'Build structure, accelerate root mass.',
        tasks: [
          'Transplant into final containers with microbial inoculant.',
          'Top above node 4 or 5, begin low-stress training to even canopy.',
          'Feed 0.8-1.2 EC solution; monitor runoff to prevent salt build-up.',
          'Defoliate damaged or shading leaves to improve airflow.',
          'Document plant height, node count, training actions.'
        ],
        aiPrompts: [
          '“Estimate final height with current veg height 18 inches and stretch factor 2×.”',
          'Upload canopy photo for AI tie-down recommendations.'
        ],
        metrics: ['PPFD 350-450', 'RH 55-65%', 'VPD 1.0-1.2 kPa']
      },
      {
        label: 'Weeks 5-6',
        stage: 'Late Vegetative / Flip Prep',
        focus: 'Even canopy, pathogen prevention.',
        tasks: [
          'Install trellis net, finalise canopy height.',
          'Perform lollipop pruning on lower growth receiving &lt;200 PPFD.',
          'Conduct final preventative IPM spray (biologicals).',
          'Verify timer accuracy and dark-period integrity.',
          'Plan nutrient transition schedule for flower.'
        ],
        aiPrompts: [
          '“List defoliation order for SCROG canopy one week before flip.”',
          'Upload canopy map to check PPFD uniformity.'
        ],
        metrics: ['RH 50-60%', 'Runoff pH 5.8-6.3', 'Leaf surface vs ambient delta &lt;2°F']
      },
      {
        label: 'Weeks 7-10',
        stage: 'Early Flower (Stretch)',
        focus: 'Manage stretch, initiate buds.',
        tasks: [
          'Switch to 12/12, ramp PPFD to 650-750.',
          'Support branches with ties/yoyos as stretch progresses.',
          'Increase bloom nutrients gradually, maintain nitrogen moderate.',
          'Inspect daily for powdery mildew and pests.',
          'Log bud site count weekly via photos.'
        ],
        aiPrompts: [
          'Upload bud site photos to track stretch uniformity.',
          '“Predict harvest date given pre-flower date and cultivar flowering length.”'
        ],
        metrics: ['Temp 76-80°F / 68-70°F night', 'RH 45-55%', 'VPD 1.1-1.3 kPa']
      },
      {
        label: 'Weeks 11-14',
        stage: 'Mid Flower',
        focus: 'Bulk buds, preserve terpenes.',
        tasks: [
          'Hold PPFD 750-850; keep RH 40-50%.',
          'Feed EC 1.4-1.8, adjust based on runoff trend.',
          'Inspect for botrytis; remove susceptible leaves near buds.',
          'Optional CO₂ supplementation to 900-1000 ppm.',
          'Document aroma changes and frost development.'
        ],
        aiPrompts: [
          'Upload macro shots; AI detects early bud rot or nutrient stress.',
          '“Is leaf fade normal at week 6 flower given current feed data?”'
        ],
        metrics: ['VPD 1.2-1.4 kPa', 'Runoff EC within ±0.3 of input']
      },
      {
        label: 'Weeks 15-16',
        stage: 'Ripening',
        focus: 'Flush, monitor maturity.',
        tasks: [
          'Begin flush 10-14 days before harvest; aim for runoff EC &lt;0.6.',
          'Lower RH to 38-45%; run dehumidifier overnight.',
          'Secure heavy branches; eliminate light leaks.',
          'Inspect trichomes every 2-3 days.',
          'Plan harvest schedule and post-harvest workflow.'
        ],
        aiPrompts: [
          'Upload trichome images for AI amber/cloudy ratio.',
          '“Provide final week ripening checklist for cultivar X.”'
        ],
        metrics: ['Night temp 65-68°F', 'Dark period fully sealed']
      },
      {
        label: 'Week 17',
        stage: 'Harvest',
        focus: 'Cut, trim, hang.',
        tasks: [
          'Harvest before lights-on; remove large fan leaves immediately.',
          'Hang branches evenly spaced with gentle airflow.',
          'Label batches with cultivar, harvest date, wet weight.',
          'Sanitise trimming tools between plants.',
          'Document wet weight and notes in Grow Log.'
        ],
        aiPrompts: [
          '“Calculate ideal dry-room settings for 6 lb wet weight in 4×8 space.”',
          'Upload harvest room photo for AI layout check.'
        ],
        metrics: ['Dry room 60°F', 'RH 55-60%', 'Airflow indirect']
      },
      {
        label: 'Week 18+',
        stage: 'Dry & Cure',
        focus: 'Equalise moisture, preserve terpenes.',
        tasks: [
          'Dry 7-10 days until small stems snap; trim buds and jar.',
          'Burp jars daily first week, every other day second week.',
          'Stabilise jar RH at 58-62% with humidity packs.',
          'Log final dry weight, potency tests, and sensory notes.',
          'Store long-term in cool, dark location (55°F, 55% RH).' 
        ],
        aiPrompts: [
          '“Troubleshoot hay aroma in jar at 64% RH day 5 of cure.”',
          'Upload cured bud photo for AI review of trim quality and mould risk.'
        ],
        metrics: ['Jar RH 58-62%', 'Cure duration minimum 21 days']
      }
    ],
    []
  );

  const safeTimelineIndex = timeline.length > 0 ? Math.min(Math.max(timelineIndex, 0), timeline.length - 1) : 0;
  const currentTimeline = timeline.length > 0 ? timeline[safeTimelineIndex] : null;

  const dailyPlaybook = useMemo(
    () => [
      {
        stage: 'Vegetative',
        tasks: {
          Morning: ['Record ambient temp/RH and CO₂', 'Inspect leaves (top/bottom) for pests or deficiencies', 'Water/feed if pots are light (target 10-15% runoff)'],
          Midday: ['Adjust LST ties or SCROG tucks', 'Check light height and PPFD map', 'Update StrainSpotter log with observations'],
          Evening: ['Final canopy inspection, remove debris', 'Confirm timers and environmental controls', 'Capture photo set for AI comparison']
        }
      },
      {
        stage: 'Flower – Weeks 1-5',
        tasks: {
          Morning: ['Measure temp/RH and VPD at canopy', 'Check for powdery mildew or pest pressure', 'Irrigate based on dryback schedule'],
          Midday: ['Review trichomes with loupe on sample buds', 'Log runoff EC/pH values', 'Upload bud photo for AI stretch monitoring'],
          Evening: ['Verify dark period light-proofing', 'Adjust dehumidifier settings for night', 'Note aroma or colour changes in log']
        }
      },
      {
        stage: 'Flower – Weeks 6+',
        tasks: {
          Morning: ['Measure jar/drying room conditions (if applicable)', 'Inspect for botrytis, remove compromised buds immediately', 'Irrigate with flush solution as scheduled'],
          Midday: ['Check support ties/yoyos, redistribute weight', 'Record trichome maturity (clear/cloudy/amber %)', 'Upload macro photo for AI ripeness assessment'],
          Evening: ['Lower night humidity, ensure airflow is unobstructed', 'Plan next-day harvest or flush tasks', 'Document any fade/purple expression']
        }
      },
      {
        stage: 'Dry & Cure',
        tasks: {
          Morning: ['Check drying room temp/RH, adjust humidifier/dehumidifier', 'Inspect hanging buds for mould or overdry tips'],
          Midday: ['Burp jars (5-10 minutes) if curing', 'Log jar RH and aroma impressions', 'Upload cured bud photo for AI storage guidance'],
          Evening: ['Re-seal jars, rotate positions, ensure storage in dark cool location', 'Plan next day QA (moisture %, jar RH)']
        }
      }
    ],
    []
  );

  const sensorSections = useMemo(
    () => [
      {
        title: 'Essential Sensors & Placement',
        body: (
          <>
            • Canopy-level temp/RH sensor (digital with logging capability).<br />
            • Root-zone probe for media temperature and moisture (optional but valuable for disease prevention).<br />
            • CO₂ monitor (NDIR) if supplementing; place at canopy height away from CO₂ source.<br />
            • PAR meter or calibrated lux meter for light intensity profiling.<br />
            • Optional leaf temperature IR gun to calculate actual VPD accurately.
          </>
        )
      },
      {
        title: 'Data Logging Workflow',
        body: (
          <>
            • Log data twice daily (lights-on and lights-off) in StrainSpotter or linked spreadsheet: temp, RH, VPD, CO₂, EC, pH, water volume.<br />
            • Sync Bluetooth/Wi-Fi sensors to mobile dashboard for alerts if thresholds breached.<br />
            • Use AI to analyse trends: “Highlight any VPD deviations &gt;0.2 kPa over last 7 days.”<br />
            • Export data at harvest for post-mortem review; adjust environment targets next cycle.
          </>
        )
      },
      {
        title: 'Automation Opportunities',
        body: (
          <>
            • Integrate smart plugs with irrigation pumps or humidifiers; automate via StrainSpotter webhook and set guardrails to avoid overwatering.<br />
            • Use controllers (Inkbird, TrolMaster) for closed-loop temp/RH management; log set-points and adjustments.<br />
            • Capture camera time-lapse to correlate growth spurts with environmental changes.
          </>
        )
      }
    ],
    []
  );

  const renderSections = (sections) => (
    <Box>
      {sections.map(({ title, body }) => (
        <Section key={title} title={title}>
          {body}
        </Section>
      ))}
    </Box>
  );

  const renderDailyPlaybook = () => (
    <Stack spacing={3}>
      {dailyPlaybook.map(({ stage, tasks }) => (
        <Paper key={stage} elevation={0} sx={{ p: 3, borderRadius: 3, background: 'rgba(255,255,255,0.96)', border: '1px solid rgba(0,0,0,0.06)' }}>
          <Typography variant="h6" fontWeight={800} gutterBottom sx={{ color: '#000' }}>
            {stage}
          </Typography>
          <Grid container spacing={2}>
            {Object.entries(tasks).map(([time, list]) => (
              <Grid item xs={12} sm={4} key={time}>
                <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#000' }}>{time}</Typography>
                <Stack spacing={0.5} sx={{ mt: 1 }}>
                  {list.map((item) => (
                    <Typography key={item} variant="body2" sx={{ color: '#000' }}>• {item}</Typography>
                  ))}
                </Stack>
              </Grid>
            ))}
          </Grid>
        </Paper>
      ))}
    </Stack>
  );

  const renderTimeline = () => (
    <Box>
      <Stack spacing={2} sx={{ mb: 3 }}>
        <Typography variant="subtitle1" fontWeight={800} sx={{ color: '#000' }}>
          Weekly Timeline
        </Typography>
        <Slider
          value={safeTimelineIndex}
          min={0}
          max={Math.max(timeline.length - 1, 0)}
          step={1}
          marks={timeline.map((entry, idx) => ({ value: idx, label: entry.label }))}
          onChange={(_e, value) => {
            const nextValue = Array.isArray(value) ? value[0] : value;
            setTimelineIndex(typeof nextValue === 'number' ? nextValue : 0);
          }}
        />
      </Stack>
      <Paper elevation={0} sx={{ p: 3, borderRadius: 3, background: 'rgba(255,255,255,0.97)', border: '1px solid rgba(0,0,0,0.06)' }}>
        {currentTimeline ? (
          <>
            <Typography variant="h6" fontWeight={800} gutterBottom sx={{ color: '#000' }}>
              {currentTimeline.stage}
            </Typography>
            <Chip label={`Focus: ${currentTimeline.focus}`} color="success" size="small" sx={{ mb: 2 }} />
            <Divider sx={{ mb: 2 }} />
            <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#000' }}>Core Tasks</Typography>
            <Stack spacing={0.5} sx={{ mt: 1, mb: 2 }}>
              {currentTimeline.tasks.map((task) => (
                <Typography key={task} variant="body2" sx={{ color: '#000' }}>• {task}</Typography>
              ))}
            </Stack>
            <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#000' }}>AI Prompts</Typography>
            <Stack spacing={0.5} sx={{ mt: 1, mb: 2 }}>
              {currentTimeline.aiPrompts.map((prompt) => (
                <Typography key={prompt} variant="body2" sx={{ color: '#000' }}>• {prompt}</Typography>
              ))}
            </Stack>
            <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#000' }}>Target Metrics</Typography>
            <Stack spacing={0.5} sx={{ mt: 1 }}>
              {currentTimeline.metrics.map((metric) => (
                <Typography key={metric} variant="body2" sx={{ color: '#000' }}>• {metric}</Typography>
              ))}
            </Stack>
          </>
        ) : (
          <Typography variant="body2" sx={{ color: '#000' }}>
            Timeline data unavailable.
          </Typography>
        )}
      </Paper>
    </Box>
  );

  const renderContent = () => {
    switch (tab) {
      case 0:
        return renderSections(overviewSections);
      case 1:
        return renderSections(setupSections);
      case 2:
        return renderSections(germinationSections);
      case 3:
        return renderSections(vegetativeSections);
      case 4:
        return renderSections(floweringSections);
      case 5:
        return renderSections(harvestSections);
      case 6:
        return renderSections(dryCureSections);
      case 7:
        return renderSections(wateringSections);
      case 8:
        return renderSections(nutrientSections);
      case 9:
        return renderSections(pestSections);
      case 10:
        return renderTimeline();
      case 11:
        return renderDailyPlaybook();
      case 12:
        return renderSections(sensorSections);
      case LOGBOOK_TAB_INDEX:
        return <GrowLogBook />;
      default:
        return null;
    }
  };

  return (
    <Container
      maxWidth="md"
      sx={{
        py: 3,
        px: { xs: 2, sm: 3 },
        background: 'rgba(248,252,248,0.96)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(0,0,0,0.12)',
        boxShadow: '0 20px 40px rgba(18,36,18,0.18)',
        minHeight: '100vh',
        position: 'relative',
        zIndex: 2
      }}
    >
      {onBack && (
        <Button
          onClick={onBack}
          startIcon={<ArrowBack />}
          sx={{ mb: 1, textTransform: 'none', fontWeight: 700, color: '#000' }}
        >
          Back to Garden
        </Button>
      )}

      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
        <MenuBook sx={{ color: '#7CB342' }} />
        <Typography variant="h5" fontWeight={900} sx={{ color: '#000' }}>
          Grow Coach
        </Typography>
      </Stack>
      <Typography variant="body2" sx={{ mb: 2, color: '#000' }}>
        Complete, step-by-step guidance from seed selection to curing, tailored for consistent mobile use. Follow the tabs in order and log every action so StrainSpotter AI can spot trends early.
      </Typography>

      <Tabs
        value={tab}
        onChange={(e, value) => setTab(value)}
        variant="scrollable"
        allowScrollButtonsMobile
        sx={{ mb: 2 }}
      >
        <Tab icon={<LocalFlorist />} iconPosition="start" label="Overview" />
        <Tab icon={<Engineering />} iconPosition="start" label="Setup" />
        <Tab icon={<Grain />} iconPosition="start" label="Germination" />
        <Tab icon={<WbSunny />} iconPosition="start" label="Vegetative" />
        <Tab icon={<Spa />} iconPosition="start" label="Flowering" />
        <Tab icon={<MenuBook />} iconPosition="start" label="Harvest" />
        <Tab icon={<Opacity />} iconPosition="start" label="Dry & Cure" />
        <Tab icon={<WaterDrop />} iconPosition="start" label="Watering & Media" />
        <Tab icon={<Science />} iconPosition="start" label="Nutrients" />
        <Tab icon={<BugReport />} iconPosition="start" label="Pests & IPM" />
        <Tab icon={<Timeline />} iconPosition="start" label="Stage Timelines" />
        <Tab icon={<Checklist />} iconPosition="start" label="Daily Tasks" />
        <Tab icon={<MonitorHeart />} iconPosition="start" label="Sensors & Data" />
        <Tab icon={<NoteAlt />} iconPosition="start" label="Logbook" />
      </Tabs>

      <Alert severity="info" sx={{ mb: 3 }}>
        Use this coach in tandem with StrainSpotter Grow Logs. Capture photos, enter metrics, and ask AI follow-up questions whenever something looks unfamiliar.
      </Alert>

      {renderContent()}
    </Container>
  );
}
