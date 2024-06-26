class TrailSerializer < ActiveModel::Serializer
  attributes :id, :name, :location, :intensity, :length, :elevation_gain, :highest_point, :summary, :dogs, :pass, :place_id, :latitude, :longitude

  has_many :reports, serializer: TrailReportSerializer
  has_many :users, serializer: TrailUserSerializer
end
