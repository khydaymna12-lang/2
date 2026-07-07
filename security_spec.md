# Firestore Security Specification & Threat Model

## 1. Data Invariants

1. **Identity Integrity**: User records in `/candidates/{candidateId}` and `/admins/{adminId}` must be writable *only* by the owner matching their `request.auth.uid`. A candidate cannot mutate another candidate's profile, and no user can self-promote to `admin` without direct admin creation.
2. **Anti-State-Shortcutting**: Active exam records in `/exams/{examId}` cannot have their `status` set to `completed` without validating structural updates. Once an exam status reaches `completed`, it becomes immutable for standard clients (Terminal State Locking).
3. **Relational Consistency**: Writing submissions in `/writing/{writingId}` and speaking submissions in `/speaking/{speakingId}` can only be created if:
   - They correspond to an existing candidate ID matching the logged-in user.
   - They specify an active, corresponding `examId`.
4. **Result Protection**: Document records in `/results/{resultId}` are completely immutable by standard candidate accounts and can only be set or modified by authorized administrators or our internal grading processes. Candidates have read-only access to their own result files.
5. **Operational Setting Integrity**: Settings inside `/settings/{settingsId}` and testing materials in `/materials/{materialId}` are only modifiable by administrators (`isAdmin()`). Standard candidates are strictly granted read-only access.
6. **Strict Temporal Integrity**: `createdAt` and `updatedAt` timestamps must always match the absolute server timestamp (`request.time`). Client-side overrides are strictly rejected.

---

## 2. The "Dirty Dozen" Payloads (Adversarial Test Matrix)

The following payload scenarios must be blocked by the Firestore rules, returning `PERMISSION_DENIED`:

### ID & Identity Spoofing Attacks
1. **Payload 1 (Adversarial candidate creation with admin role)**:
   - Path: `/candidates/attacker_uid`
   - Payload: `{ "uid": "attacker_uid", "role": "admin", "name": "Attacker", "email": "evil@attacker.com", "language": "en", "createdAt": "request.time", "updatedAt": "request.time" }`
   - *Security Failure*: Allowing a user to specify `role: "admin"` in a profile creation.
2. **Payload 2 (Attempt to hijack someone else's profile)**:
   - Path: `/candidates/victim_uid`
   - Payload: `{ "uid": "victim_uid", "name": "Evil Hacked Name" }`
   - *Security Failure*: Mutating a profile document where `{candidateId} != request.auth.uid`.
3. **Payload 3 (Malicious ID Injection - Path Poisoning)**:
   - Path: `/candidates/poisoned_id_very_long_junk_character_string_for_wallet_denial_attack_here`
   - Payload: `{ "uid": "poisoned_id_very_long_junk_character_string_for_wallet_denial_attack_here", "name": "Poison" }`
   - *Security Failure*: Writing to an excessively long or non-alphanumeric document path ID.

### State Transition & Shortcut Attacks
4. **Payload 4 (Directly creating a completed exam)**:
   - Path: `/exams/exam_123`
   - Payload: `{ "id": "exam_123", "candidateId": "attacker_uid", "status": "completed", "timeLeft": 0, "answers": {}, "createdAt": "request.time", "updatedAt": "request.time" }`
   - *Security Failure*: Creating an exam with a terminal `completed` status without going through the progressive `ongoing` exam phase.
5. **Payload 5 (Overwriting a completed exam)**:
   - Path: `/exams/exam_123` (where existing status is `'completed'`)
   - Payload: `{ "timeLeft": 3600, "status": "ongoing", "updatedAt": "request.time" }`
   - *Security Failure*: Resetting status from `completed` back to `ongoing` to get extra test time.
6. **Payload 6 (Stealing exam progress of another candidate)**:
   - Path: `/exams/victim_exam_123`
   - Payload: `{ "answers": { "q1": "stolen" } }`
   - *Security Failure*: Writing to an exam document where `candidateId != request.auth.uid`.

### Orphaned Records & Boundary Violations
7. **Payload 7 (Creating an orphaned essay)**:
   - Path: `/writing/essay_123`
   - Payload: `{ "id": "essay_123", "examId": "non_existent_exam_id", "candidateId": "attacker_uid", "essayAnswer": "Short", "score": 9, "maxScore": 9, "band": "C2", "feedback": "fake", "createdAt": "request.time", "updatedAt": "request.time" }`
   - *Security Failure*: Inserting an essay referencing a non-existent exam ID, or writing a pre-graded high score without admin authorization.
8. **Payload 8 (Injecting colossal payload - Denial of Wallet)**:
   - Path: `/writing/essay_123`
   - Payload: `{ "essayAnswer": "[...10 Megabytes of random text...]" }`
   - *Security Failure*: Allowing unbounded string lengths inside responses.

### Configuration & Settings Hijacking
9. **Payload 9 (Hacking global timer settings)**:
   - Path: `/settings/test_config`
   - Payload: `{ "testDuration": 99999, "passingScore": 0 }`
   - *Security Failure*: Modifying configurations from a candidate/student account.
10. **Payload 10 (Hijacking testing materials)**:
    - Path: `/materials/default_material`
    - Payload: `{ "writingPrompt": "Tell me a joke.", "listeningQuestions": [] }`
    - *Security Failure*: Student altering standard reading/listening curriculum questions.

### Security Query Scrapes & PII Leakage
11. **Payload 11 (Blanket reading all candidate profiles)**:
    - Path: `/candidates` (Query list attempt with no where constraints)
    - Query: `db.collection('candidates').get()`
    - *Security Failure*: Exposing all candidate PII to unauthorized listeners.
12. **Payload 12 (Directly writing/approving own Results file)**:
    - Path: `/results/my_result_123`
    - Payload: `{ "overallCEFR": "C2", "status": "completed", "candidateId": "attacker_uid" }`
    - *Security Failure*: Granting standard clients permission to insert or modify their own result records.

---

## 3. Test Specification (Verification Framework)

```typescript
// firestore.rules.test.ts
// Threat Mitigation Test cases verifying strict compliance

describe('Linguistic Diagnostics Platform - Security Audit', () => {
  it('should deny unauthorized user profile edits', async () => {
    const db = getFirestoreForUser('attacker_uid');
    const docRef = doc(db, 'candidates', 'victim_uid');
    await assertFails(setDoc(docRef, { name: 'Hacked' }));
  });

  it('should deny self-promotion to administrator role', async () => {
    const db = getFirestoreForUser('attacker_uid');
    const docRef = doc(db, 'candidates', 'attacker_uid');
    await assertFails(setDoc(docRef, { role: 'admin' }));
  });

  it('should deny writing to settings or materials collections by student', async () => {
    const db = getFirestoreForUser('attacker_uid');
    const settingsRef = doc(db, 'settings', 'test_config');
    await assertFails(updateDoc(settingsRef, { testDuration: 100 }));
  });

  it('should lock terminal exam sessions after completion', async () => {
    const db = getFirestoreForUser('attacker_uid');
    const examRef = doc(db, 'exams', 'exam_completed_123');
    // Already marked completed inside DB
    await assertFails(updateDoc(examRef, { status: 'ongoing', timeLeft: 1000 }));
  });

  it('should reject non-server timestamp writes for auditing', async () => {
    const db = getFirestoreForUser('attacker_uid');
    const examRef = doc(db, 'exams', 'exam_new');
    await assertFails(setDoc(examRef, { 
      id: 'exam_new', 
      candidateId: 'attacker_uid', 
      status: 'ongoing', 
      createdAt: '2020-01-01T00:00:00Z', 
      timeLeft: 120, 
      answers: {} 
    }));
  });
});
```
