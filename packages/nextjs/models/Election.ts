import mongoose, { Schema, Document } from 'mongoose';

interface Election extends Document {
    orgID: string;
    electionID: string;
    electionName: string;
    status: number;
}

const electionSchema: Schema = new Schema({
    orgID: { type: String, required: true },
    electionID: { type: String, required: true },
    electionName: { type: String, required: true },
    status: { type: Number, required: true }
});

export default mongoose.models.Election || mongoose.model<Election>('Election', electionSchema);
