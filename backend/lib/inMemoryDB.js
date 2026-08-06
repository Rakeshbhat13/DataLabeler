const { randomUUID } = require('crypto');

class InMemoryDB {
  constructor() {
    this.datasets = new Map();
    this.dataPoints = new Map();
  }

  createDataset({ name, description, owner }) {
    const dataset = {
      _id: randomUUID(),
      name,
      description,
      owner,
      totalCount: 0,
      createdAt: new Date()
    };
    this.datasets.set(dataset._id, dataset);
    return dataset;
  }

  listDatasetsByOwner(owner) {
    return [...this.datasets.values()]
      .filter(dataset => dataset.owner === owner)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  findDatasetById(id) {
    return this.datasets.get(id) || null;
  }

  incDatasetCount(id, count) {
    const dataset = this.findDatasetById(id);
    if (dataset) {
      dataset.totalCount += count;
    }
    return dataset;
  }

  insertDataPoints(docs) {
    const inserted = docs.map(doc => {
      const dataPoint = {
        _id: randomUUID(),
        datasetId: doc.datasetId,
        rawText: doc.rawText,
        label: null,
        labeledBy: null,
        labeledAt: null,
        claimedBy: null,
        claimedAt: null,
        createdAt: new Date()
      };
      this.dataPoints.set(dataPoint._id, dataPoint);
      return dataPoint;
    });
    return inserted;
  }

  countDataPoints(filter) {
    return [...this.dataPoints.values()].filter(dataPoint => {
      if (filter.datasetId && dataPoint.datasetId !== filter.datasetId) return false;
      if (filter.labelNotNull) return dataPoint.label !== null;
      if (filter.label === null) return dataPoint.label === null;
      if (filter.label !== undefined) return dataPoint.label === filter.label;
      return true;
    }).length;
  }

  claimNext(datasetId, userId) {
    const candidate = [...this.dataPoints.values()]
      .filter(dataPoint => dataPoint.datasetId === datasetId && dataPoint.label === null && dataPoint.claimedBy === null)
      .sort((a, b) => a.createdAt - b.createdAt)[0];
    if (!candidate) return null;
    candidate.claimedBy = userId;
    candidate.claimedAt = new Date();
    return candidate;
  }

  updateDataPointLabel(id, label, userId) {
    const dataPoint = this.dataPoints.get(id);
    if (!dataPoint) return null;
    dataPoint.label = label;
    dataPoint.labeledBy = userId;
    dataPoint.labeledAt = new Date();
    dataPoint.claimedBy = null;
    dataPoint.claimedAt = null;
    return dataPoint;
  }

  getDataPointsByDataset(datasetId) {
    return [...this.dataPoints.values()]
      .filter(dataPoint => dataPoint.datasetId === datasetId)
      .sort((a, b) => a.createdAt - b.createdAt);
  }
}

module.exports = new InMemoryDB();
