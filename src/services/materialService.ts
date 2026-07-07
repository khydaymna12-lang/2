import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { TestMaterial } from '../types';
import { handleFirestoreError, OperationType } from '../utils/firestoreError';

// Rich, high-quality placement test material for reading, listening, writing, and speaking
const defaultTestMaterial: TestMaterial = {
  id: 'default_material',
  listeningAudioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', // Open source high quality test track
  listeningQuestions: [
    {
      id: 'l1',
      section: 'listening',
      type: 'multiple-choice',
      questionText: 'What is the speaker’s primary reason for calling the reservation office?',
      options: [
        'To cancel an existing conference booking',
        'To query about catering options for a workshop',
        'To confirm the date and venue size for a team meeting',
        'To request an upgrade to a premium executive room'
      ],
      correctAnswer: '2' // index of the option (0-indexed) or value. Let's use string index '2' ("To confirm the date and venue size...")
    },
    {
      id: 'l2',
      section: 'listening',
      type: 'multiple-choice',
      questionText: 'According to the conversation, when does the main session begin?',
      options: [
        'At 8:30 AM',
        'At 9:00 AM',
        'At 9:30 AM',
        'At 10:00 AM'
      ],
      correctAnswer: '1'
    },
    {
      id: 'l3',
      section: 'listening',
      type: 'gap-fill',
      questionText: 'The catering coordinator suggests serving a lunch menu that is entirely ______.',
      placeholder: 'vegetarian / gluten-free / organic',
      correctAnswer: 'vegetarian'
    },
    {
      id: 'l4',
      section: 'listening',
      type: 'multiple-choice',
      questionText: 'What additional service must the speaker pay a supplementary fee for?',
      options: [
        'Wireless high-speed Internet',
        'Advanced visual projection equipment',
        'Secured basement car parking',
        'Coffee and light snacks on arrival'
      ],
      correctAnswer: '1'
    },
    {
      id: 'l5',
      section: 'listening',
      type: 'gap-fill',
      questionText: 'The total reservation deposit must be fully settled by next ______ afternoon.',
      placeholder: 'Friday / Monday / Wednesday',
      correctAnswer: 'Friday'
    }
  ],
  readingPassages: [
    {
      id: 'rp1',
      title: 'The Rise of Urban Agriculture',
      text: 'Urban agriculture is the practice of cultivating, processing, and distributing food in or around urban areas. Once considered a niche hobby for environmental advocates, it is fast transforming into an essential pillar of smart-city designs worldwide. Proponents argue that localizing food production significantly diminishes the "food miles" associated with trucking produce from rural areas, thereby lowering carbon emissions. \n\nHowever, implementing urban farms presents unique hurdles. Land acquisition in dense city centers is prohibitively costly, driving growers to seek innovative alternatives like vertical hydroponics or rooftop garden cooperatives. Soil quality is another pressing challenge; vacant metropolitan plots are frequently contaminated with lead or other industrial chemicals from historical runoff. This requires comprehensive soil remediation or fully closed soil-less systems. Despite these impediments, metropolitan community farms have proven exceptionally beneficial for social cohesion, successfully transforming eyesores into vibrant hubs that educate children and reinforce neighborly relationships.',
      questions: [
        {
          id: 'r1',
          section: 'reading',
          type: 'multiple-choice',
          questionText: 'What is the main objective of urban agriculture according to the first paragraph?',
          options: [
            'To replace rural food supply systems entirely',
            'To cultivate food locally and reduce transit emissions',
            'To generate direct employment for structural engineers',
            'To provide free food baskets to suburban communities'
          ],
          correctAnswer: '1'
        },
        {
          id: 'r2',
          section: 'reading',
          type: 'multiple-choice',
          questionText: 'What major economic barrier exists for metropolitan farmers?',
          options: [
            'Shortage of water supplies in cities',
            'Extremely high cost of land plots',
            'Lack of interest from local residents',
            'Strict zero-emission logistics laws'
          ],
          correctAnswer: '1'
        },
        {
          id: 'r3',
          section: 'reading',
          type: 'gap-fill',
          questionText: 'Industrial contaminants such as ______ present a soil quality hazard for urban farming projects.',
          placeholder: 'lead / chemicals / acid',
          correctAnswer: 'lead'
        },
        {
          id: 'r4',
          section: 'reading',
          type: 'multiple-choice',
          questionText: 'The author mentions "rooftop garden cooperatives" as an example of:',
          options: [
            'A tool to combat soil contamination',
            'An alternative to high-cost city center land acquisition',
            'A primary source of municipal taxation',
            'A modern aesthetic architectural decoration'
          ],
          correctAnswer: '1'
        }
      ]
    },
    {
      id: 'rp2',
      title: 'Decentralized Currencies and Digital Networks',
      text: 'Blockchain technology, the underlying mechanism behind cryptocurrencies, represents a revolutionary paradigm shift in transactional security. Historically, establishing trust required a centralized authority, such as a state bank or card processor, to authenticate ledger changes. Blockchains replace these intermediaries with decentralized cryptographic consensus networks. Each block contains a verified batch of transactions, securely chained together using cryptographic hashes. This makes retrospective alteration of transaction logs computationally unfeasible.\n\nWhile critics frequently point to high transaction energy costs and the speculative volatility of digital tokens, developers are shifting focus towards smart contract capabilities. These self-executing agreements represent automated, tamper-proof business rules that trigger when conditions are met. These protocols open up profound opportunities for supply-chain logging, digitized digital identity tracking, and democratic micro-governance structures that operate independently of legacy administrative bureaucracies.',
      questions: [
        {
          id: 'r5',
          section: 'reading',
          type: 'multiple-choice',
          questionText: 'Which phrase best captures the core function of blockchain technology?',
          options: [
            'Slowing down digital transaction times',
            'Replacing central clearing houses with cryptographic networks',
            'Allowing private banks to trace user locations',
            'Decreasing the total supply of global fiat money'
          ],
          correctAnswer: '1'
        },
        {
          id: 'r6',
          section: 'reading',
          type: 'gap-fill',
          questionText: 'Retrospective alteration of blockchain records is preventively difficult because blocks are joined using cryptographic ______.',
          placeholder: 'hashes / protocols / tokens',
          correctAnswer: 'hashes'
        },
        {
          id: 'r7',
          section: 'reading',
          type: 'multiple-choice',
          questionText: 'According to the text, what are smart contracts?',
          options: [
            'Legal treaties signed by international state parties',
            'Self-executing business protocols triggered by conditions',
            'Artificial intelligence agents managing corporate boards',
            'Sophisticated encryption keys for electronic emails'
          ],
          correctAnswer: '1'
        }
      ]
    }
  ],
  writingPrompt: 'In many contemporary cities, historical monuments and older residential houses are being demolished to make way for modern offices and commercial skyscrapers. Is this a positive development, or should historical architectures be preserved at all costs? Provide details and examples supporting your perspective.',
  writingTargetWords: 150,
  speakingPrompt: 'Describe a public facility or urban green space (such as a park, public library, or community museum) that you enjoy visiting. You should say: \n- Where it is located\n- What amenities or features it offers\n- Who you typically go with\nAnd explain why you feel this facility is valuable to your local community.',
  speakingPreparationTime: 30,
  speakingRecordingTime: 60
};

export const materialService = {
  // Fetch default test material
  async getTestMaterial(): Promise<TestMaterial> {
    const docPath = 'materials/default_material';
    const materialRef = doc(db, 'materials', 'default_material');
    try {
      const docSnap = await getDoc(materialRef);
      if (docSnap.exists()) {
        return docSnap.data() as TestMaterial;
      } else {
        // Automatically seed default materials if empty
        try {
          await setDoc(materialRef, {
            ...defaultTestMaterial,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        } catch (e) {
          console.warn("Could not seed default materials to Firestore (expected for non-admins or offline):", e);
        }
        return defaultTestMaterial;
      }
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      if (errMsg.includes('offline') || errMsg.includes('unavailable')) {
        console.warn("Using offline default materials:", errMsg);
      } else {
        console.error('Error fetching/seeding materials:', error);
      }
      // If the GET operation itself has a permission error, propagate it
      if (error instanceof Error && error.message.includes('permission')) {
        handleFirestoreError(error, OperationType.GET, docPath);
      }
      return defaultTestMaterial;
    }
  },

  // Save modified test materials
  async saveTestMaterial(material: TestMaterial): Promise<void> {
    const docPath = `materials/${material.id || 'default_material'}`;
    try {
      const materialRef = doc(db, 'materials', material.id || 'default_material');
      await setDoc(materialRef, {
        ...material,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, docPath);
    }
  }
};
export { defaultTestMaterial };
