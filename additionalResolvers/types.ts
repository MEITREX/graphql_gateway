import { AssessmentItemType } from "./lib";

export type Args<T extends AssessmentItemType> = {
    item: { id: string };
    assessmentId: string;
} & (T extends AssessmentItemType.QuizAssessment
    ? {
          questionInput: any;
      }
    : T extends AssessmentItemType.FlashcardAssessment
    ? {
          flashcardInput: any;
      }
    : never);

type AssessmentMetadata = {
    name: string;
    rewardPoints: number;
    suggestedDate: string; // ISO date string
    tagNames: string[];
    chapterId: string;
};

type AssessmentDetails = {
    initialLearningInterval: number | null;
    skillPoints: number;
    skillTypes: string[];
};

export type AssessmentItem = {
    id: string;
    associatedSkills: string[]; // Assuming it's an array of skill identifiers
    associatedBloomLevels: string[]; // Assuming it's an array of Bloom levels
};

export type Assessment = {
    metadata: AssessmentMetadata;
    assessmentMetadata: AssessmentDetails;
    items: AssessmentItem[];
    __typename: "QuizAssessment";
};

type UpdatedItems = {
    updateAssessment: {
        id: string;
        items: AssessmentItem[];
        __typename: "QuizAssessment";
    };
};

type Answer = {
    answerText: string; // JSON string representing rich text content
    correct: boolean;
    feedback: string | null; // JSON string representing rich text content or null
};

type QuestionInput = {
    itemId: string;
    text: string; // JSON string representing rich text content
    answers: Answer[];
    hint: string; // JSON string representing rich text content
};

type Question = {
    _internal_noauth_updateMultipleChoiceQuestion: {
        assessmentId: string;
        questionPool: any[]; // Assuming it's an array, but needs more details
    };
};

// Full data structure
type LogData = {
    assessment: Assessment;
    assessmentAdjusted: Assessment;
    updatedItems: UpdatedItems;
    questionInput: QuestionInput;
    question: Question;
};
