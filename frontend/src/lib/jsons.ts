
export interface JSONCourse {
    name?: string;
    id?: string;
    admins?: string[];
    students?: string[];
    quiz_ids?: string[];
    state?: JSONCourseState;
    dojo_ids?: string[];
}

export interface JSONQuiz {
    id?: string;
    title?: string;
    questions?: JSONQuestion[];
}

export interface JSONQuestion {
    title?: string;
    intro?: string;
    choice?: JSONChoice;
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
    matches?: string[];
}

export interface JSONCourseState {
    Idle?: {};
    Quiz?: string;
    Corrections?: string;
}

export interface JSONDojo {
    id?: string,
    quiz_id?: string,
    results?: { [key: string]: string },
}

export interface JSONDojoResult {
    id?: string;
    dojo_id?: string;
    results?: JSONDojoChoice[];
}

export interface JSONDojoChoice {
    Multi?: number[];
    Regexp?: string;
}