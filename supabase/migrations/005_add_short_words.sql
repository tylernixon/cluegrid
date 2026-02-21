-- ============================================================================
-- Cluegrid: Add Common Short Words (3-4 letters)
-- Migration 005
--
-- Adds common 3-letter and 4-letter words to support crosser puzzles with
-- shorter words. These are valid guesses for any puzzle.
-- ============================================================================

-- 3-letter words (common English words)
INSERT INTO words (word) VALUES
-- A
('ACE'), ('ACT'), ('ADD'), ('AGE'), ('AGO'), ('AID'), ('AIM'), ('AIR'), ('ALL'), ('AND'),
('ANT'), ('ANY'), ('APE'), ('ARC'), ('ARE'), ('ARK'), ('ARM'), ('ART'), ('ASH'), ('ASK'),
('ATE'), ('AWE'), ('AXE'),
-- B
('BAD'), ('BAG'), ('BAN'), ('BAR'), ('BAT'), ('BAY'), ('BED'), ('BEE'), ('BET'), ('BIG'),
('BIT'), ('BOW'), ('BOX'), ('BOY'), ('BUD'), ('BUG'), ('BUN'), ('BUS'), ('BUT'), ('BUY'),
-- C
('CAB'), ('CAN'), ('CAP'), ('CAR'), ('CAT'), ('COB'), ('COD'), ('COG'), ('COP'), ('COT'),
('COW'), ('CRY'), ('CUB'), ('CUD'), ('CUP'), ('CUR'), ('CUT'),
-- D
('DAB'), ('DAD'), ('DAM'), ('DAY'), ('DEN'), ('DEW'), ('DID'), ('DIE'), ('DIG'), ('DIM'),
('DIP'), ('DOC'), ('DOE'), ('DOG'), ('DOT'), ('DRY'), ('DUB'), ('DUD'), ('DUE'), ('DUG'),
('DYE'),
-- E
('EAR'), ('EAT'), ('EEL'), ('EGG'), ('ELF'), ('ELK'), ('ELM'), ('EMU'), ('END'), ('ERA'),
('EVE'), ('EWE'), ('EYE'),
-- F
('FAD'), ('FAN'), ('FAR'), ('FAT'), ('FAX'), ('FED'), ('FEE'), ('FEW'), ('FIG'), ('FIN'),
('FIR'), ('FIT'), ('FIX'), ('FLU'), ('FLY'), ('FOB'), ('FOE'), ('FOG'), ('FOR'), ('FOX'),
('FRY'), ('FUN'), ('FUR'),
-- G
('GAB'), ('GAG'), ('GAP'), ('GAS'), ('GAY'), ('GEL'), ('GEM'), ('GET'), ('GIG'), ('GIN'),
('GNU'), ('GOB'), ('GOD'), ('GOT'), ('GUM'), ('GUN'), ('GUT'), ('GUY'), ('GYM'),
-- H
('HAD'), ('HAM'), ('HAS'), ('HAT'), ('HAY'), ('HEM'), ('HEN'), ('HER'), ('HEW'), ('HEX'),
('HID'), ('HIM'), ('HIP'), ('HIS'), ('HIT'), ('HOB'), ('HOG'), ('HOP'), ('HOT'), ('HOW'),
('HUB'), ('HUE'), ('HUG'), ('HUM'), ('HUT'),
-- I
('ICE'), ('ICY'), ('ILL'), ('IMP'), ('INK'), ('INN'), ('ION'), ('IRE'), ('IRK'), ('ITS'),
('IVY'),
-- J
('JAB'), ('JAG'), ('JAM'), ('JAR'), ('JAW'), ('JAY'), ('JET'), ('JIG'), ('JOB'), ('JOG'),
('JOT'), ('JOY'), ('JUG'), ('JUT'),
-- K
('KEG'), ('KEN'), ('KEY'), ('KID'), ('KIN'), ('KIT'),
-- L
('LAB'), ('LAC'), ('LAD'), ('LAG'), ('LAP'), ('LAW'), ('LAX'), ('LAY'), ('LEA'), ('LED'),
('LEG'), ('LET'), ('LID'), ('LIE'), ('LIP'), ('LIT'), ('LOG'), ('LOT'), ('LOW'), ('LUG'),
-- M
('MAD'), ('MAN'), ('MAP'), ('MAR'), ('MAT'), ('MAW'), ('MAY'), ('MEN'), ('MET'), ('MID'),
('MIX'), ('MOB'), ('MOM'), ('MOP'), ('MUD'), ('MUG'), ('MUM'),
-- N
('NAB'), ('NAG'), ('NAP'), ('NAY'), ('NET'), ('NEW'), ('NIL'), ('NIT'), ('NOB'), ('NOD'),
('NOR'), ('NOT'), ('NOW'), ('NUB'), ('NUN'), ('NUT'),
-- O
('OAK'), ('OAR'), ('OAT'), ('ODD'), ('ODE'), ('OFF'), ('OFT'), ('OHM'), ('OIL'), ('OLD'),
('ONE'), ('OPT'), ('ORB'), ('ORE'), ('OUR'), ('OUT'), ('OWE'), ('OWL'), ('OWN'),
-- P
('PAD'), ('PAL'), ('PAN'), ('PAP'), ('PAR'), ('PAT'), ('PAW'), ('PAY'), ('PEA'), ('PEG'),
('PEN'), ('PEP'), ('PER'), ('PET'), ('PEW'), ('PIE'), ('PIG'), ('PIN'), ('PIT'), ('PLY'),
('POD'), ('POP'), ('POT'), ('POW'), ('PRY'), ('PUB'), ('PUN'), ('PUP'), ('PUS'), ('PUT'),
-- Q
-- (few 3-letter Q words without U)
-- R
('RAG'), ('RAM'), ('RAN'), ('RAP'), ('RAT'), ('RAW'), ('RAY'), ('RED'), ('REF'), ('REP'),
('RIB'), ('RID'), ('RIG'), ('RIM'), ('RIP'), ('ROB'), ('ROD'), ('ROE'), ('ROT'), ('ROW'),
('RUB'), ('RUG'), ('RUM'), ('RUN'), ('RUT'), ('RYE'),
-- S
('SAC'), ('SAD'), ('SAG'), ('SAP'), ('SAT'), ('SAW'), ('SAY'), ('SEA'), ('SET'), ('SEW'),
('SHE'), ('SHY'), ('SIN'), ('SIP'), ('SIR'), ('SIS'), ('SIT'), ('SIX'), ('SKI'), ('SKY'),
('SLY'), ('SOB'), ('SOD'), ('SON'), ('SOP'), ('SOT'), ('SOW'), ('SOY'), ('SPA'), ('SPY'),
('STY'), ('SUB'), ('SUM'), ('SUN'), ('SUP'),
-- T
('TAB'), ('TAD'), ('TAG'), ('TAN'), ('TAP'), ('TAR'), ('TAT'), ('TAX'), ('TEA'), ('TEN'),
('THE'), ('THY'), ('TIC'), ('TIE'), ('TIN'), ('TIP'), ('TOE'), ('TON'), ('TOO'), ('TOP'),
('TOT'), ('TOW'), ('TOY'), ('TRY'), ('TUB'), ('TUG'), ('TWO'),
-- U
('UGH'), ('UMP'), ('UNS'), ('UPS'), ('URN'), ('USE'),
-- V
('VAN'), ('VAT'), ('VET'), ('VIA'), ('VIE'), ('VOW'),
-- W
('WAD'), ('WAG'), ('WAR'), ('WAS'), ('WAX'), ('WAY'), ('WEB'), ('WED'), ('WEE'), ('WET'),
('WHO'), ('WHY'), ('WIG'), ('WIN'), ('WIT'), ('WOE'), ('WOK'), ('WON'), ('WOO'), ('WOW'),
-- X
-- (few common 3-letter X words)
-- Y
('YAK'), ('YAM'), ('YAP'), ('YAW'), ('YEA'), ('YEN'), ('YEP'), ('YES'), ('YET'), ('YEW'),
('YIN'), ('YIP'), ('YOU'), ('YOW'),
-- Z
('ZAP'), ('ZED'), ('ZEN'), ('ZIP'), ('ZIT'), ('ZOO')
ON CONFLICT (word) DO NOTHING;

-- 4-letter words (common English words)
INSERT INTO words (word) VALUES
-- A
('ABLE'), ('ACHE'), ('ACID'), ('ACRE'), ('AGED'), ('AIDE'), ('ALSO'), ('AMID'), ('ARCH'),
('AREA'), ('ARMY'), ('ATOM'), ('AUTO'), ('AWAY'), ('AWRY'),
-- B
('BABY'), ('BACK'), ('BAIT'), ('BAKE'), ('BALD'), ('BALL'), ('BAND'), ('BANG'), ('BANK'),
('BARE'), ('BARK'), ('BARN'), ('BASE'), ('BATH'), ('BEAD'), ('BEAK'), ('BEAM'), ('BEAN'),
('BEAR'), ('BEAT'), ('BEEF'), ('BEEN'), ('BEER'), ('BELL'), ('BELT'), ('BEND'), ('BENT'),
('BEST'), ('BIKE'), ('BILL'), ('BIND'), ('BIRD'), ('BITE'), ('BLOW'), ('BLUE'), ('BLUR'),
('BOAT'), ('BODY'), ('BOIL'), ('BOLD'), ('BOLT'), ('BOMB'), ('BOND'), ('BONE'), ('BOOK'),
('BOOM'), ('BOOT'), ('BORE'), ('BORN'), ('BOSS'), ('BOTH'), ('BOWL'), ('BRED'), ('BREW'),
('BUCK'), ('BULB'), ('BULK'), ('BULL'), ('BUMP'), ('BURN'), ('BURY'), ('BUSH'), ('BUSY'),
('BUZZ'),
-- C
('CAFE'), ('CAGE'), ('CAKE'), ('CALF'), ('CALL'), ('CALM'), ('CAME'), ('CAMP'), ('CANE'),
('CAPE'), ('CARD'), ('CARE'), ('CARL'), ('CART'), ('CASE'), ('CASH'), ('CAST'), ('CAVE'),
('CELL'), ('CHAT'), ('CHEF'), ('CHEW'), ('CHIN'), ('CHIP'), ('CHOP'), ('CITY'), ('CLAD'),
('CLAM'), ('CLAP'), ('CLAW'), ('CLAY'), ('CLIP'), ('CLUB'), ('CLUE'), ('COAL'), ('COAT'),
('COCK'), ('CODE'), ('COIL'), ('COIN'), ('COLD'), ('COLE'), ('COLT'), ('COMB'), ('COME'),
('CONE'), ('COOK'), ('COOL'), ('COPE'), ('COPY'), ('CORD'), ('CORE'), ('CORK'), ('CORN'),
('COST'), ('COZY'), ('CRAB'), ('CREW'), ('CRIB'), ('CROP'), ('CROW'), ('CUBE'), ('CULT'),
('CURB'), ('CURE'), ('CURL'), ('CUTE'),
-- D
('DAME'), ('DAMP'), ('DARE'), ('DARK'), ('DART'), ('DASH'), ('DATA'), ('DATE'), ('DAWN'),
('DAYS'), ('DEAD'), ('DEAF'), ('DEAL'), ('DEAN'), ('DEAR'), ('DEBT'), ('DECK'), ('DEED'),
('DEEM'), ('DEEP'), ('DEER'), ('DEMO'), ('DENT'), ('DENY'), ('DESK'), ('DIAL'), ('DICE'),
('DIET'), ('DIRT'), ('DISC'), ('DISH'), ('DISK'), ('DIVE'), ('DOCK'), ('DOES'), ('DOLL'),
('DOME'), ('DONE'), ('DOOM'), ('DOOR'), ('DOSE'), ('DOVE'), ('DOWN'), ('DOZE'), ('DRAG'),
('DRAW'), ('DREW'), ('DRIP'), ('DROP'), ('DRUG'), ('DRUM'), ('DUAL'), ('DUCK'), ('DUDE'),
('DUEL'), ('DUKE'), ('DULL'), ('DUMB'), ('DUMP'), ('DUNE'), ('DUNK'), ('DUSK'), ('DUST'),
('DUTY'),
-- E
('EACH'), ('EARL'), ('EARN'), ('EASE'), ('EAST'), ('EASY'), ('ECHO'), ('EDGE'), ('EDIT'),
('ELSE'), ('EMIT'), ('ENVY'), ('EPIC'), ('EVEN'), ('EVER'), ('EVIL'), ('EXAM'), ('EXEC'),
('EXIT'), ('EXPO'), ('EYED'), ('EYES'),
-- F
('FACE'), ('FACT'), ('FADE'), ('FAIL'), ('FAIR'), ('FAKE'), ('FALL'), ('FAME'), ('FANG'),
('FARE'), ('FARM'), ('FAST'), ('FATE'), ('FEAR'), ('FEAT'), ('FEED'), ('FEEL'), ('FEET'),
('FELL'), ('FELT'), ('FERN'), ('FEST'), ('FILE'), ('FILL'), ('FILM'), ('FIND'), ('FINE'),
('FIRE'), ('FIRM'), ('FISH'), ('FIST'), ('FLAG'), ('FLAK'), ('FLAP'), ('FLAT'), ('FLAW'),
('FLEA'), ('FLED'), ('FLEE'), ('FLEW'), ('FLEX'), ('FLIP'), ('FLOW'), ('FLUX'), ('FOAM'),
('FOCI'), ('FOES'), ('FOIL'), ('FOLD'), ('FOLK'), ('FOND'), ('FONT'), ('FOOD'), ('FOOL'),
('FOOT'), ('FORD'), ('FORE'), ('FORK'), ('FORM'), ('FORT'), ('FOUL'), ('FOUR'), ('FOWL'),
('FREE'), ('FRET'), ('FROM'), ('FUEL'), ('FULL'), ('FUME'), ('FUND'), ('FUNK'), ('FUSE'),
('FUSS'), ('FUZZ'),
-- G
('GAIN'), ('GAIT'), ('GALE'), ('GAME'), ('GANG'), ('GATE'), ('GAVE'), ('GAZE'), ('GEAR'),
('GENE'), ('GIFT'), ('GILD'), ('GILT'), ('GIRL'), ('GIST'), ('GIVE'), ('GLAD'), ('GLEN'),
('GLIB'), ('GLIM'), ('GLOB'), ('GLUE'), ('GLUM'), ('GNAT'), ('GNAW'), ('GOAL'), ('GOAT'),
('GOES'), ('GOLD'), ('GOLF'), ('GONE'), ('GOOD'), ('GORE'), ('GORY'), ('GOWN'), ('GRAB'),
('GRAD'), ('GRAM'), ('GRAY'), ('GREW'), ('GREY'), ('GRID'), ('GRIM'), ('GRIN'), ('GRIP'),
('GRIT'), ('GROW'), ('GRUB'), ('GULF'), ('GULL'), ('GULP'), ('GURU'), ('GUST'), ('GUTS'),
-- H
('HACK'), ('HAIL'), ('HAIR'), ('HALE'), ('HALF'), ('HALL'), ('HALT'), ('HAND'), ('HANG'),
('HANK'), ('HARD'), ('HARE'), ('HARM'), ('HARP'), ('HATE'), ('HAUL'), ('HAVE'), ('HAWK'),
('HAZE'), ('HAZY'), ('HEAD'), ('HEAL'), ('HEAP'), ('HEAR'), ('HEAT'), ('HECK'), ('HEED'),
('HEEL'), ('HEIR'), ('HELD'), ('HELL'), ('HELM'), ('HELP'), ('HEMP'), ('HERD'), ('HERE'),
('HERO'), ('HERS'), ('HIDE'), ('HIGH'), ('HIKE'), ('HILL'), ('HILT'), ('HIND'), ('HINT'),
('HIRE'), ('HISS'), ('HITS'), ('HIVE'), ('HOAX'), ('HOLD'), ('HOLE'), ('HOLY'), ('HOME'),
('HONE'), ('HONK'), ('HOOD'), ('HOOF'), ('HOOK'), ('HOOP'), ('HOPE'), ('HOPS'), ('HORN'),
('HOSE'), ('HOST'), ('HOUR'), ('HOWL'), ('HUGE'), ('HULL'), ('HUMP'), ('HUNG'), ('HUNK'),
('HUNT'), ('HURL'), ('HURT'), ('HUSH'), ('HYMN'),
-- I
('ICON'), ('IDEA'), ('IDLE'), ('IDOL'), ('INCH'), ('INFO'), ('INTO'), ('IONS'), ('IRIS'),
('IRON'), ('ISLE'), ('ITCH'), ('ITEM'),
-- J
('JACK'), ('JADE'), ('JAIL'), ('JANE'), ('JARS'), ('JAVA'), ('JAWS'), ('JAZZ'), ('JEAN'),
('JEER'), ('JELL'), ('JERK'), ('JEST'), ('JOBS'), ('JOIN'), ('JOKE'), ('JOLT'), ('JOSH'),
('JOTS'), ('JOWL'), ('JOYS'), ('JUDO'), ('JUGS'), ('JUMP'), ('JUNE'), ('JUNK'), ('JURY'),
('JUST'),
-- K
('KALE'), ('KEEN'), ('KEEP'), ('KELP'), ('KEPT'), ('KEYS'), ('KICK'), ('KIDS'), ('KILL'),
('KILT'), ('KIND'), ('KING'), ('KINK'), ('KISS'), ('KITE'), ('KNEE'), ('KNEW'), ('KNIT'),
('KNOB'), ('KNOT'), ('KNOW'),
-- L
('LABS'), ('LACE'), ('LACK'), ('LACY'), ('LAID'), ('LAIR'), ('LAKE'), ('LAMB'), ('LAME'),
('LAMP'), ('LAND'), ('LANE'), ('LAPS'), ('LARD'), ('LARK'), ('LASH'), ('LASS'), ('LAST'),
('LATE'), ('LAUD'), ('LAWN'), ('LAWS'), ('LAZY'), ('LEAD'), ('LEAF'), ('LEAK'), ('LEAN'),
('LEAP'), ('LEAS'), ('LEER'), ('LEFT'), ('LEND'), ('LENS'), ('LENT'), ('LESS'), ('LIAR'),
('LICE'), ('LICK'), ('LIDS'), ('LIED'), ('LIEN'), ('LIES'), ('LIEU'), ('LIFE'), ('LIFT'),
('LIKE'), ('LILY'), ('LIMB'), ('LIME'), ('LIMP'), ('LINE'), ('LINK'), ('LINT'), ('LION'),
('LIPS'), ('LIST'), ('LIVE'), ('LOAD'), ('LOAF'), ('LOAN'), ('LOBE'), ('LOCK'), ('LOFT'),
('LOGO'), ('LOGS'), ('LONE'), ('LONG'), ('LOOK'), ('LOOM'), ('LOOP'), ('LOOT'), ('LORD'),
('LORE'), ('LOSE'), ('LOSS'), ('LOST'), ('LOTS'), ('LOUD'), ('LOUT'), ('LOVE'), ('LUCK'),
('LULL'), ('LUMP'), ('LUNG'), ('LURE'), ('LURK'), ('LUSH'), ('LUST'),
-- M
('MACE'), ('MADE'), ('MAID'), ('MAIL'), ('MAIN'), ('MAKE'), ('MALE'), ('MALL'), ('MALT'),
('MANE'), ('MANY'), ('MAPS'), ('MARK'), ('MARS'), ('MASH'), ('MASK'), ('MASS'), ('MAST'),
('MATE'), ('MATH'), ('MAZE'), ('MEAL'), ('MEAN'), ('MEAT'), ('MEEK'), ('MEET'), ('MELT'),
('MEMO'), ('MEND'), ('MENU'), ('MERE'), ('MESH'), ('MESS'), ('MICE'), ('MIKE'), ('MILD'),
('MILE'), ('MILK'), ('MILL'), ('MIME'), ('MIND'), ('MINE'), ('MINT'), ('MISS'), ('MIST'),
('MITE'), ('MITT'), ('MOAN'), ('MOAT'), ('MOCK'), ('MODE'), ('MOLD'), ('MOLE'), ('MOLT'),
('MONK'), ('MOOD'), ('MOON'), ('MOOR'), ('MOPE'), ('MORE'), ('MORN'), ('MOSS'), ('MOST'),
('MOTH'), ('MOVE'), ('MUCH'), ('MUCK'), ('MUDS'), ('MUFF'), ('MULE'), ('MURK'), ('MUSE'),
('MUSH'), ('MUSK'), ('MUST'), ('MUTE'),
-- N
('NAIL'), ('NAME'), ('NAPE'), ('NAVY'), ('NEAR'), ('NEAT'), ('NECK'), ('NEED'), ('NEON'),
('NERD'), ('NEST'), ('NEWS'), ('NEXT'), ('NICE'), ('NICK'), ('NINE'), ('NODE'), ('NONE'),
('NOOK'), ('NOON'), ('NORM'), ('NOSE'), ('NOTE'), ('NOUN'),
-- O
('OAKS'), ('OARS'), ('OATH'), ('OBEY'), ('ODDS'), ('ODOR'), ('OILS'), ('OILY'), ('OKAY'),
('OMEN'), ('OMIT'), ('ONCE'), ('ONES'), ('ONLY'), ('ONTO'), ('OOPS'), ('OOZE'), ('OPAL'),
('OPEN'), ('OPTS'), ('OPUS'), ('ORAL'), ('ORCA'), ('ORES'), ('OURS'), ('OUST'), ('OVEN'),
('OVER'), ('OWED'), ('OWES'), ('OWLS'), ('OWNS'),
-- P
('PACE'), ('PACK'), ('PACT'), ('PAGE'), ('PAID'), ('PAIL'), ('PAIN'), ('PAIR'), ('PALE'),
('PALM'), ('PANE'), ('PANT'), ('PARK'), ('PART'), ('PASS'), ('PAST'), ('PATH'), ('PAVE'),
('PAWN'), ('PEAK'), ('PEAL'), ('PEAR'), ('PEAS'), ('PEAT'), ('PECK'), ('PEEK'), ('PEEL'),
('PEER'), ('PELT'), ('PENS'), ('PENT'), ('PEON'), ('PERK'), ('PERM'), ('PEST'), ('PETS'),
('PICK'), ('PIER'), ('PIES'), ('PIKE'), ('PILE'), ('PILL'), ('PIMP'), ('PINE'), ('PING'),
('PINK'), ('PINS'), ('PINT'), ('PIPE'), ('PITS'), ('PITY'), ('PLAN'), ('PLAY'), ('PLEA'),
('PLOD'), ('PLOP'), ('PLOT'), ('PLOW'), ('PLUG'), ('PLUM'), ('PLUS'), ('POCK'), ('PODS'),
('POEM'), ('POET'), ('POKE'), ('POLE'), ('POLL'), ('POLO'), ('POMP'), ('POND'), ('PONY'),
('POOL'), ('POOP'), ('POOR'), ('POPS'), ('PORE'), ('PORK'), ('PORT'), ('POSE'), ('POSH'),
('POST'), ('POTS'), ('POUR'), ('POUT'), ('PRAY'), ('PREP'), ('PREY'), ('PRIM'), ('PROD'),
('PROM'), ('PROP'), ('PROS'), ('PROW'), ('PRYS'), ('PUBS'), ('PUCK'), ('PUFF'), ('PUGS'),
('PULL'), ('PULP'), ('PUMP'), ('PUNK'), ('PUNS'), ('PUPA'), ('PUPS'), ('PURE'), ('PUSH'),
('PUTS'), ('PUTT'),
-- Q
('QUAD'), ('QUAY'), ('QUIT'), ('QUIZ'),
-- R
('RACE'), ('RACK'), ('RAFT'), ('RAGE'), ('RAGS'), ('RAID'), ('RAIL'), ('RAIN'), ('RAKE'),
('RAMP'), ('RAMS'), ('RANG'), ('RANK'), ('RANT'), ('RAPE'), ('RARE'), ('RASH'), ('RASP'),
('RATE'), ('RATS'), ('RAVE'), ('RAYS'), ('RAZE'), ('READ'), ('REAL'), ('REAM'), ('REAP'),
('REAR'), ('REDO'), ('REED'), ('REEF'), ('REEK'), ('REEL'), ('RELY'), ('REND'), ('RENT'),
('REST'), ('RIBS'), ('RICE'), ('RICH'), ('RIDE'), ('RIDS'), ('RIFT'), ('RIGS'), ('RILE'),
('RILL'), ('RIMS'), ('RIND'), ('RING'), ('RIOT'), ('RIPE'), ('RIPS'), ('RISE'), ('RISK'),
('RITE'), ('ROAD'), ('ROAM'), ('ROAR'), ('ROBE'), ('ROBS'), ('ROCK'), ('RODE'), ('RODS'),
('ROLE'), ('ROLL'), ('ROMP'), ('ROOF'), ('ROOK'), ('ROOM'), ('ROOT'), ('ROPE'), ('ROSE'),
('ROSY'), ('ROTS'), ('ROUT'), ('ROVE'), ('ROWS'), ('RUBS'), ('RUBY'), ('RUDE'), ('RUED'),
('RUES'), ('RUFF'), ('RUGS'), ('RUIN'), ('RULE'), ('RUMP'), ('RUMS'), ('RUNE'), ('RUNG'),
('RUNS'), ('RUNT'), ('RUSE'), ('RUSH'), ('RUST'), ('RUTS'),
-- S
('SACK'), ('SAFE'), ('SAGA'), ('SAGE'), ('SAID'), ('SAIL'), ('SAKE'), ('SALE'), ('SALT'),
('SAME'), ('SAND'), ('SANE'), ('SANG'), ('SANK'), ('SASH'), ('SAVE'), ('SAYS'), ('SCAB'),
('SCAM'), ('SCAN'), ('SCAR'), ('SEAL'), ('SEAM'), ('SEAR'), ('SEAS'), ('SEAT'), ('SECT'),
('SEED'), ('SEEK'), ('SEEM'), ('SEEN'), ('SELF'), ('SELL'), ('SEMI'), ('SEND'), ('SENT'),
('SETS'), ('SEWN'), ('SHED'), ('SHIM'), ('SHIN'), ('SHIP'), ('SHIV'), ('SHOD'), ('SHOE'),
('SHOO'), ('SHOP'), ('SHOT'), ('SHOW'), ('SHUN'), ('SHUT'), ('SICK'), ('SIDE'), ('SIFT'),
('SIGH'), ('SIGN'), ('SILK'), ('SILL'), ('SILO'), ('SING'), ('SINK'), ('SIPS'), ('SIRE'),
('SITE'), ('SITS'), ('SIZE'), ('SKID'), ('SKIM'), ('SKIN'), ('SKIP'), ('SLAB'), ('SLAG'),
('SLAM'), ('SLAP'), ('SLAT'), ('SLAW'), ('SLAY'), ('SLED'), ('SLEW'), ('SLID'), ('SLIM'),
('SLIT'), ('SLOB'), ('SLOP'), ('SLOT'), ('SLOW'), ('SLUG'), ('SLUM'), ('SLUR'), ('SMOG'),
('SNAP'), ('SNAG'), ('SNIP'), ('SNOB'), ('SNOW'), ('SNUB'), ('SNUG'), ('SOAK'), ('SOAP'),
('SOAR'), ('SOBS'), ('SOCK'), ('SODA'), ('SOFA'), ('SOFT'), ('SOIL'), ('SOLD'), ('SOLE'),
('SOME'), ('SONG'), ('SONS'), ('SOON'), ('SOOT'), ('SORE'), ('SORT'), ('SOUL'), ('SOUP'),
('SOUR'), ('SPAN'), ('SPAR'), ('SPAT'), ('SPEC'), ('SPED'), ('SPIN'), ('SPIT'), ('SPOT'),
('SPUD'), ('SPUN'), ('SPUR'), ('STAB'), ('STAG'), ('STAR'), ('STAY'), ('STEM'), ('STEP'),
('STEW'), ('STIR'), ('STOP'), ('STUB'), ('STUD'), ('STUN'), ('SUCH'), ('SUCK'), ('SUDS'),
('SUED'), ('SUIT'), ('SULK'), ('SUMS'), ('SUNG'), ('SUNK'), ('SUNS'), ('SURE'), ('SURF'),
('SWAY'), ('SWIM'), ('SWUM'), ('SYNC'),
-- T
('TABS'), ('TACK'), ('TACT'), ('TAGS'), ('TAIL'), ('TAKE'), ('TALE'), ('TALK'), ('TALL'),
('TAME'), ('TANG'), ('TANK'), ('TAPE'), ('TAPS'), ('TART'), ('TASK'), ('TEAM'), ('TEAR'),
('TEAS'), ('TECH'), ('TEEM'), ('TEEN'), ('TELL'), ('TEND'), ('TENS'), ('TENT'), ('TERM'),
('TEST'), ('TEXT'), ('THAN'), ('THAT'), ('THAW'), ('THEM'), ('THEN'), ('THEY'), ('THIN'),
('THIS'), ('THOU'), ('THUD'), ('THUG'), ('THUS'), ('TICK'), ('TIDE'), ('TIDY'), ('TIED'),
('TIER'), ('TIES'), ('TILE'), ('TILL'), ('TILT'), ('TIME'), ('TINT'), ('TINY'), ('TIPS'),
('TIRE'), ('TOAD'), ('TOED'), ('TOES'), ('TOFU'), ('TOGA'), ('TOGS'), ('TOIL'), ('TOLD'),
('TOLL'), ('TOMB'), ('TOME'), ('TONE'), ('TONS'), ('TOOK'), ('TOOL'), ('TOPS'), ('TORE'),
('TORN'), ('TORT'), ('TOSS'), ('TOUR'), ('TOUT'), ('TOWN'), ('TOYS'), ('TRAM'), ('TRAP'),
('TRAY'), ('TREE'), ('TREK'), ('TRIM'), ('TRIO'), ('TRIP'), ('TROD'), ('TROT'), ('TRUE'),
('TUBE'), ('TUBS'), ('TUCK'), ('TUFT'), ('TUGS'), ('TUNA'), ('TUNE'), ('TURF'), ('TURN'),
('TUSK'), ('TUTU'), ('TWIG'), ('TWIN'), ('TWIT'), ('TYPE'),
-- U
('UGLY'), ('UNDO'), ('UNIT'), ('UPON'), ('URGE'), ('URNS'), ('USED'), ('USER'), ('USES'),
-- V
('VAIN'), ('VALE'), ('VANE'), ('VARY'), ('VASE'), ('VAST'), ('VATS'), ('VEER'), ('VEIL'),
('VEIN'), ('VEND'), ('VENT'), ('VERB'), ('VERY'), ('VEST'), ('VETO'), ('VIAL'), ('VICE'),
('VIED'), ('VIES'), ('VIEW'), ('VILE'), ('VINE'), ('VISA'), ('VISE'), ('VOID'), ('VOLT'),
('VOTE'), ('VOWS'),
-- W
('WADE'), ('WADS'), ('WAFT'), ('WAGE'), ('WAGS'), ('WAIF'), ('WAIL'), ('WAIT'), ('WAKE'),
('WALK'), ('WALL'), ('WAND'), ('WANT'), ('WARD'), ('WARM'), ('WARN'), ('WARP'), ('WARS'),
('WART'), ('WARY'), ('WASH'), ('WASP'), ('WAVE'), ('WAVY'), ('WAXY'), ('WAYS'), ('WEAK'),
('WEAN'), ('WEAR'), ('WEDS'), ('WEED'), ('WEEK'), ('WEEP'), ('WELD'), ('WELL'), ('WELT'),
('WENT'), ('WEPT'), ('WERE'), ('WEST'), ('WHAT'), ('WHEN'), ('WHIM'), ('WHIP'), ('WICK'),
('WIDE'), ('WIFE'), ('WIGS'), ('WILD'), ('WILL'), ('WILT'), ('WIMP'), ('WIND'), ('WINE'),
('WING'), ('WINK'), ('WINS'), ('WIPE'), ('WIRE'), ('WIRY'), ('WISE'), ('WISH'), ('WISP'),
('WITH'), ('WITS'), ('WOKE'), ('WOLF'), ('WOMB'), ('WONT'), ('WOOD'), ('WOOF'), ('WOOL'),
('WORD'), ('WORE'), ('WORK'), ('WORM'), ('WORN'), ('WOVE'), ('WRAP'), ('WREN'),
-- X
-- (few common 4-letter X words)
-- Y
('YACK'), ('YAMS'), ('YANG'), ('YANK'), ('YAPS'), ('YARD'), ('YARN'), ('YAWN'), ('YAWP'),
('YEAR'), ('YEAS'), ('YELL'), ('YELP'), ('YEPS'), ('YOGA'), ('YOKE'), ('YOLK'), ('YOUR'),
('YOWL'),
-- Z
('ZAPS'), ('ZEAL'), ('ZERO'), ('ZEST'), ('ZINC'), ('ZING'), ('ZIPS'), ('ZONE'), ('ZOOM'),
('ZOOS')
ON CONFLICT (word) DO NOTHING;
