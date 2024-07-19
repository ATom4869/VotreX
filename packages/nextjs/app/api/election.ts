import type { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '../../lib/mongodb';
import Election from '../../models/Election';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        try {
            const { orgID, electionID, electionName, candidateCounts } = req.body;

            // Connect to the database
            await connectToDatabase();

            // Create a new election document
            const newElection = new Election({
                orgID,
                electionID,
                electionName,
                status: 0, // Default status for a new election
            });

            // Save the election data to MongoDB
            await newElection.save();

            res.status(201).json({ message: 'Election created successfully' });
        } catch (error) {
            res.status(500).json({ error: 'Error creating election' });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
