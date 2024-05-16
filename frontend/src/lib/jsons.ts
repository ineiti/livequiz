
export interface JSONCourse {
    name?: string;
    id?: string;
    admins?: string[];
    students?: string[];
    quizIds?: string[];
    state?: JSONCourseState;
    dojoIds?: string[];
}

export interface JSONQuiz {
    id?: string;
    title?: string;
    questions?: JSONQuestion[];
}

export interface JSONQuestion {
    title?: string;
    intro?: string;
    options?: JSONChoice;
    explanation?: string;
}

export interface JSONChoice {
    Multi?: JSONChoiceMulti;
    Regexp?: JSONChoiceRegexp;
}

export interface JSONChoiceMulti {
    correct?: string[];
    wrong?: string[];
}

export interface JSONChoiceRegexp {
    replace?: string[];
    match?: string[];
}

export interface JSONCourseState {
    Idle?: {};
    Dojo?: string;
    Corrections?: string;
}

export interface JSONDojo {
    id?: string,
    quizId?: string,
    attempts?: { [key: string]: string },
}

export interface JSONDojoAttempt {
    id?: string;
    dojoId?: string;
    choices?: JSONDojoChoice[];
}

export interface JSONDojoChoice {
    Multi?: number[];
    Regexp?: string;
}
